use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::instructions::{
    CreateV1CpiBuilder, CreateV1InstructionArgs,
};
use mpl_token_metadata::types::{Creator, PrintSupply, TokenStandard};

declare_id!("TaskSama11111111111111111111111111111111111");

#[program]
pub mod tasksama {
    use super::*;

    /// Initialize the platform with configuration
    pub fn initialize(
        ctx: Context<Initialize>,
        fee_percentage: u16,
        minimum_reward: u64,
    ) -> Result<()> {
        let platform_config = &mut ctx.accounts.platform_config;
        platform_config.authority = ctx.accounts.authority.key();
        platform_config.fee_recipient = ctx.accounts.fee_recipient.key();
        platform_config.fee_percentage = fee_percentage;
        platform_config.minimum_reward = minimum_reward;
        platform_config.total_tasks_created = 0;
        platform_config.total_tasks_completed = 0;
        platform_config.bump = ctx.bumps.platform_config;

        msg!("Platform initialized with fee {}% and minimum reward {} lamports", fee_percentage, minimum_reward);
        Ok(())
    }

    /// Create a new task with SOL reward
    pub fn create_task(
        ctx: Context<CreateTask>,
        title: String,
        description: String,
        reward_amount: u64,
    ) -> Result<()> {
        let platform_config = &ctx.accounts.platform_config;
        let task = &mut ctx.accounts.task;
        let creator = &ctx.accounts.creator;

        // Validate reward amount
        require!(
            reward_amount >= platform_config.minimum_reward,
            TaskError::RewardTooLow
        );

        // Validate string lengths
        require!(title.len() <= 200, TaskError::TitleTooLong);
        require!(description.len() <= 1000, TaskError::DescriptionTooLong);

        // Calculate fee and net reward
        let fee_amount = (reward_amount as u128)
            .checked_mul(platform_config.fee_percentage as u128)
            .unwrap()
            .checked_div(100)
            .unwrap() as u64;
        let net_reward = reward_amount.checked_sub(fee_amount).unwrap();

        // Transfer total reward to task escrow
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &creator.key(),
            &task.key(),
            reward_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                creator.to_account_info(),
                task.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // Initialize task data
        task.task_id = platform_config.total_tasks_created;
        task.creator = creator.key();
        task.title = title;
        task.description = description;
        task.reward_amount = net_reward;
        task.fee_amount = fee_amount;
        task.status = TaskStatus::Active;
        task.created_at = Clock::get()?.unix_timestamp;
        task.participant_count = 0;
        task.winner = None;
        task.bump = ctx.bumps.task;

        // Increment global counter
        let platform_config = &mut ctx.accounts.platform_config;
        platform_config.total_tasks_created = platform_config
            .total_tasks_created
            .checked_add(1)
            .unwrap();

        emit!(TaskCreatedEvent {
            task_id: task.task_id,
            creator: task.creator,
            title: task.title.clone(),
            reward_amount: net_reward,
            timestamp: task.created_at,
        });

        Ok(())
    }

    /// Participate in a task
    pub fn participate(ctx: Context<Participate>) -> Result<()> {
        let task = &mut ctx.accounts.task;
        let participant_record = &mut ctx.accounts.participant_record;
        let participant = &ctx.accounts.participant;

        // Validate task is active
        require!(task.status == TaskStatus::Active, TaskError::TaskNotActive);

        // Validate not creator
        require!(task.creator != participant.key(), TaskError::CreatorCannotParticipate);

        // Initialize participant record
        participant_record.task_id = task.task_id;
        participant_record.participant = participant.key();
        participant_record.participated_at = Clock::get()?.unix_timestamp;
        participant_record.video_uploaded = false;
        participant_record.video_moderated = ModerationStatus::Pending;
        participant_record.bump = ctx.bumps.participant_record;

        // Increment participant count
        task.participant_count = task.participant_count.checked_add(1).unwrap();

        emit!(ParticipationEvent {
            task_id: task.task_id,
            participant: participant.key(),
            timestamp: participant_record.participated_at,
        });

        Ok(())
    }

    /// Mark video as uploaded (called by backend after video upload)
    pub fn mark_video_uploaded(
        ctx: Context<MarkVideoUploaded>,
        video_hash: String,
    ) -> Result<()> {
        let participant_record = &mut ctx.accounts.participant_record;

        require!(
            participant_record.participant == ctx.accounts.participant.key(),
            TaskError::Unauthorized
        );

        participant_record.video_uploaded = true;
        participant_record.video_hash = Some(video_hash.clone());

        emit!(VideoUploadedEvent {
            task_id: participant_record.task_id,
            participant: participant_record.participant,
            video_hash,
        });

        Ok(())
    }

    /// Moderate a video (admin only)
    pub fn moderate_video(
        ctx: Context<ModerateVideo>,
        approved: bool,
    ) -> Result<()> {
        let participant_record = &mut ctx.accounts.participant_record;
        let platform_config = &ctx.accounts.platform_config;

        // Only platform authority can moderate
        require!(
            platform_config.authority == ctx.accounts.moderator.key(),
            TaskError::Unauthorized
        );

        participant_record.video_moderated = if approved {
            ModerationStatus::Approved
        } else {
            ModerationStatus::Rejected
        };

        emit!(VideoModeratedEvent {
            task_id: participant_record.task_id,
            participant: participant_record.participant,
            approved,
        });

        Ok(())
    }

    /// Choose winner and distribute rewards
    pub fn choose_winner(
        ctx: Context<ChooseWinner>,
        ipfs_metadata_url: String,
        ipfs_video_url: String,
    ) -> Result<()> {
        let task = &mut ctx.accounts.task;
        let winner_record = &ctx.accounts.winner_record;
        let platform_config = &ctx.accounts.platform_config;

        // Validate only creator can choose
        require!(task.creator == ctx.accounts.creator.key(), TaskError::Unauthorized);

        // Validate task is active
        require!(task.status == TaskStatus::Active, TaskError::TaskNotActive);

        // Validate winner is participant
        require!(
            winner_record.task_id == task.task_id,
            TaskError::NotParticipant
        );

        // Validate video is approved
        require!(
            winner_record.video_moderated == ModerationStatus::Approved,
            TaskError::VideoNotApproved
        );

        // Transfer fee to platform
        **task.to_account_info().try_borrow_mut_lamports()? -= task.fee_amount;
        **ctx.accounts.fee_recipient.try_borrow_mut_lamports()? += task.fee_amount;

        // Transfer reward to winner
        **task.to_account_info().try_borrow_mut_lamports()? -= task.reward_amount;
        **ctx.accounts.winner.try_borrow_mut_lamports()? += task.reward_amount;

        // Update task status
        task.status = TaskStatus::Completed;
        task.winner = Some(ctx.accounts.winner.key());
        task.completed_at = Some(Clock::get()?.unix_timestamp);
        task.ipfs_metadata_url = Some(ipfs_metadata_url.clone());
        task.ipfs_video_url = Some(ipfs_video_url.clone());

        // Update global stats
        let platform_config = &mut ctx.accounts.platform_config;
        platform_config.total_tasks_completed = platform_config
            .total_tasks_completed
            .checked_add(1)
            .unwrap();

        emit!(TaskCompletedEvent {
            task_id: task.task_id,
            winner: ctx.accounts.winner.key(),
            reward_amount: task.reward_amount,
            ipfs_metadata_url,
            ipfs_video_url,
            timestamp: task.completed_at.unwrap(),
        });

        Ok(())
    }

    /// Mint commemorative NFT for completed task (using Metaplex)
    pub fn mint_video_nft(
        ctx: Context<MintVideoNFT>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        let task = &ctx.accounts.task;

        // Validate task is completed
        require!(task.status == TaskStatus::Completed, TaskError::TaskNotCompleted);

        // Mint NFT to creator using Metaplex
        let creator_info = Creator {
            address: ctx.accounts.creator.key(),
            verified: true,
            share: 100,
        };

        CreateV1CpiBuilder::new(&ctx.accounts.token_metadata_program.to_account_info())
            .metadata(&ctx.accounts.metadata.to_account_info())
            .master_edition(Some(&ctx.accounts.master_edition.to_account_info()))
            .mint(&ctx.accounts.mint.to_account_info(), true)
            .authority(&ctx.accounts.creator.to_account_info())
            .payer(&ctx.accounts.creator.to_account_info())
            .update_authority(&ctx.accounts.creator.to_account_info(), true)
            .system_program(&ctx.accounts.system_program.to_account_info())
            .sysvar_instructions(&ctx.accounts.sysvar_instructions.to_account_info())
            .spl_token_program(&ctx.accounts.token_program.to_account_info())
            .name(name.clone())
            .symbol(symbol)
            .uri(uri.clone())
            .seller_fee_basis_points(0)
            .token_standard(TokenStandard::NonFungible)
            .creators(vec![creator_info])
            .is_mutable(false)
            .print_supply(PrintSupply::Zero)
            .invoke()?;

        emit!(NFTMintedEvent {
            task_id: task.task_id,
            mint: ctx.accounts.mint.key(),
            creator: ctx.accounts.creator.key(),
            name,
            uri,
        });

        Ok(())
    }

    /// Cancel task and refund (only if no approved participants)
    pub fn cancel_task(ctx: Context<CancelTask>) -> Result<()> {
        let task = &mut ctx.accounts.task;

        // Validate only creator can cancel
        require!(task.creator == ctx.accounts.creator.key(), TaskError::Unauthorized);

        // Validate task is active
        require!(task.status == TaskStatus::Active, TaskError::TaskNotActive);

        // TODO: Check no approved videos exist (would require iterating participants)
        // For now, we trust the creator

        // Refund reward + fee to creator
        let total_refund = task.reward_amount.checked_add(task.fee_amount).unwrap();
        **task.to_account_info().try_borrow_mut_lamports()? -= total_refund;
        **ctx.accounts.creator.try_borrow_mut_lamports()? += total_refund;

        // Update task status
        task.status = TaskStatus::Cancelled;

        emit!(TaskCancelledEvent {
            task_id: task.task_id,
            refund_amount: total_refund,
        });

        Ok(())
    }
}

// ============================================================================
// Account Structures
// ============================================================================

#[account]
pub struct PlatformConfig {
    pub authority: Pubkey,           // Platform admin
    pub fee_recipient: Pubkey,       // Where fees go
    pub fee_percentage: u16,         // Fee percentage (e.g., 5 = 5%)
    pub minimum_reward: u64,         // Minimum task reward in lamports
    pub total_tasks_created: u64,    // Global counter
    pub total_tasks_completed: u64,  // Global counter
    pub bump: u8,
}

#[account]
pub struct Task {
    pub task_id: u64,                     // Unique task ID
    pub creator: Pubkey,                  // Task creator
    pub title: String,                    // Task title (max 200 chars)
    pub description: String,              // Task description (max 1000 chars)
    pub reward_amount: u64,               // Net reward in lamports
    pub fee_amount: u64,                  // Fee amount in lamports
    pub status: TaskStatus,               // Current status
    pub created_at: i64,                  // Unix timestamp
    pub completed_at: Option<i64>,        // Unix timestamp
    pub participant_count: u32,           // Number of participants
    pub winner: Option<Pubkey>,           // Winner's pubkey
    pub ipfs_metadata_url: Option<String>, // IPFS metadata URL
    pub ipfs_video_url: Option<String>,   // IPFS video URL
    pub bump: u8,
}

#[account]
pub struct ParticipantRecord {
    pub task_id: u64,                      // Associated task ID
    pub participant: Pubkey,               // Participant's pubkey
    pub participated_at: i64,              // Unix timestamp
    pub video_uploaded: bool,              // Has uploaded video
    pub video_hash: Option<String>,        // Video hash/URL
    pub video_moderated: ModerationStatus, // Moderation status
    pub bump: u8,
}

// ============================================================================
// Enums
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TaskStatus {
    Active,
    Completed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ModerationStatus {
    Pending,
    Approved,
    Rejected,
}

// ============================================================================
// Context Structures
// ============================================================================

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 2 + 8 + 8 + 8 + 1,
        seeds = [b"platform_config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Fee recipient can be any account
    pub fee_recipient: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateTask<'info> {
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        init,
        payer = creator,
        space = 8 + 8 + 32 + 200 + 1000 + 8 + 8 + 1 + 8 + 9 + 4 + 33 + 256 + 256 + 1,
        seeds = [b"task", platform_config.total_tasks_created.to_le_bytes().as_ref()],
        bump
    )]
    pub task: Account<'info, Task>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Participate<'info> {
    #[account(
        mut,
        seeds = [b"task", task.task_id.to_le_bytes().as_ref()],
        bump = task.bump
    )]
    pub task: Account<'info, Task>,

    #[account(
        init,
        payer = participant,
        space = 8 + 8 + 32 + 8 + 1 + 256 + 1 + 1,
        seeds = [b"participant", task.key().as_ref(), participant.key().as_ref()],
        bump
    )]
    pub participant_record: Account<'info, ParticipantRecord>,

    #[account(mut)]
    pub participant: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MarkVideoUploaded<'info> {
    #[account(
        mut,
        seeds = [b"participant", task.key().as_ref(), participant.key().as_ref()],
        bump = participant_record.bump
    )]
    pub participant_record: Account<'info, ParticipantRecord>,

    #[account(
        seeds = [b"task", task.task_id.to_le_bytes().as_ref()],
        bump = task.bump
    )]
    pub task: Account<'info, Task>,

    pub participant: Signer<'info>,
}

#[derive(Accounts)]
pub struct ModerateVideo<'info> {
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [b"participant", task.key().as_ref(), participant_record.participant.as_ref()],
        bump = participant_record.bump
    )]
    pub participant_record: Account<'info, ParticipantRecord>,

    #[account(
        seeds = [b"task", task.task_id.to_le_bytes().as_ref()],
        bump = task.bump
    )]
    pub task: Account<'info, Task>,

    pub moderator: Signer<'info>,
}

#[derive(Accounts)]
pub struct ChooseWinner<'info> {
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [b"task", task.task_id.to_le_bytes().as_ref()],
        bump = task.bump
    )]
    pub task: Account<'info, Task>,

    #[account(
        seeds = [b"participant", task.key().as_ref(), winner.key().as_ref()],
        bump = winner_record.bump
    )]
    pub winner_record: Account<'info, ParticipantRecord>,

    #[account(mut)]
    pub creator: Signer<'info>,

    /// CHECK: Winner receives the reward
    #[account(mut)]
    pub winner: AccountInfo<'info>,

    /// CHECK: Fee recipient from platform config
    #[account(
        mut,
        constraint = fee_recipient.key() == platform_config.fee_recipient
    )]
    pub fee_recipient: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintVideoNFT<'info> {
    #[account(
        seeds = [b"task", task.task_id.to_le_bytes().as_ref()],
        bump = task.bump
    )]
    pub task: Account<'info, Task>,

    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        mint::decimals = 0,
        mint::authority = creator,
        mint::freeze_authority = creator,
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: Validated by Metaplex
    #[account(mut)]
    pub metadata: AccountInfo<'info>,

    /// CHECK: Validated by Metaplex
    #[account(mut)]
    pub master_edition: AccountInfo<'info>,

    /// CHECK: Metaplex Token Metadata Program
    pub token_metadata_program: AccountInfo<'info>,

    /// CHECK: Sysvar instructions
    pub sysvar_instructions: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CancelTask<'info> {
    #[account(
        mut,
        seeds = [b"task", task.task_id.to_le_bytes().as_ref()],
        bump = task.bump,
        constraint = task.status == TaskStatus::Active
    )]
    pub task: Account<'info, Task>,

    #[account(
        mut,
        constraint = creator.key() == task.creator
    )]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct TaskCreatedEvent {
    pub task_id: u64,
    pub creator: Pubkey,
    pub title: String,
    pub reward_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ParticipationEvent {
    pub task_id: u64,
    pub participant: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct VideoUploadedEvent {
    pub task_id: u64,
    pub participant: Pubkey,
    pub video_hash: String,
}

#[event]
pub struct VideoModeratedEvent {
    pub task_id: u64,
    pub participant: Pubkey,
    pub approved: bool,
}

#[event]
pub struct TaskCompletedEvent {
    pub task_id: u64,
    pub winner: Pubkey,
    pub reward_amount: u64,
    pub ipfs_metadata_url: String,
    pub ipfs_video_url: String,
    pub timestamp: i64,
}

#[event]
pub struct NFTMintedEvent {
    pub task_id: u64,
    pub mint: Pubkey,
    pub creator: Pubkey,
    pub name: String,
    pub uri: String,
}

#[event]
pub struct TaskCancelledEvent {
    pub task_id: u64,
    pub refund_amount: u64,
}

// ============================================================================
// Errors
// ============================================================================

#[error_code]
pub enum TaskError {
    #[msg("Reward amount is below minimum required")]
    RewardTooLow,
    #[msg("Title is too long (max 200 characters)")]
    TitleTooLong,
    #[msg("Description is too long (max 1000 characters)")]
    DescriptionTooLong,
    #[msg("Task is not active")]
    TaskNotActive,
    #[msg("Creator cannot participate in their own task")]
    CreatorCannotParticipate,
    #[msg("User is not a participant of this task")]
    NotParticipant,
    #[msg("Video has not been approved by moderators")]
    VideoNotApproved,
    #[msg("Task is not completed")]
    TaskNotCompleted,
    #[msg("Unauthorized action")]
    Unauthorized,
}
