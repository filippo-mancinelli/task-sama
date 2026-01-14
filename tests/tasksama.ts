import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Tasksama } from "../target/types/tasksama";
import { assert } from "chai";

describe("tasksama", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Tasksama as Program<Tasksama>;
  const authority = provider.wallet as anchor.Wallet;
  const feeRecipient = anchor.web3.Keypair.generate();

  let platformConfigPda: anchor.web3.PublicKey;
  let platformConfigBump: number;

  let taskPda: anchor.web3.PublicKey;
  let taskBump: number;

  const creator = anchor.web3.Keypair.generate();
  const participant = anchor.web3.Keypair.generate();

  before(async () => {
    // Airdrop SOL to test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        creator.publicKey,
        10 * anchor.web3.LAMPORTS_PER_SOL
      )
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        participant.publicKey,
        10 * anchor.web3.LAMPORTS_PER_SOL
      )
    );

    // Find PDAs
    [platformConfigPda, platformConfigBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      program.programId
    );
  });

  it("Initialize platform", async () => {
    const feePercentage = 5;
    const minimumReward = anchor.web3.LAMPORTS_PER_SOL; // 1 SOL minimum

    await program.methods
      .initialize(feePercentage, new anchor.BN(minimumReward))
      .accounts({
        platformConfig: platformConfigPda,
        authority: authority.publicKey,
        feeRecipient: feeRecipient.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.platformConfig.fetch(platformConfigPda);
    assert.equal(config.feePercentage, feePercentage);
    assert.equal(config.minimumReward.toNumber(), minimumReward);
    assert.equal(config.totalTasksCreated.toNumber(), 0);
  });

  it("Create a task", async () => {
    const title = "Build a dApp";
    const description = "Create a decentralized application on Solana";
    const rewardAmount = 5 * anchor.web3.LAMPORTS_PER_SOL; // 5 SOL

    // Get current task count
    const config = await program.account.platformConfig.fetch(platformConfigPda);
    const taskId = config.totalTasksCreated;

    [taskPda, taskBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("task"), taskId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .createTask(title, description, new anchor.BN(rewardAmount))
      .accounts({
        platformConfig: platformConfigPda,
        task: taskPda,
        creator: creator.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const task = await program.account.task.fetch(taskPda);
    assert.equal(task.title, title);
    assert.equal(task.description, description);
    assert.equal(task.creator.toString(), creator.publicKey.toString());
    assert.equal(task.participantCount, 0);

    // Verify escrow holds the reward
    const taskAccountInfo = await provider.connection.getAccountInfo(taskPda);
    assert.isAtLeast(taskAccountInfo.lamports, rewardAmount);
  });

  it("Participate in task", async () => {
    const config = await program.account.platformConfig.fetch(platformConfigPda);
    const taskId = config.totalTasksCreated.toNumber() - 1;

    const [participantRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("participant"),
        taskPda.toBuffer(),
        participant.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .participate()
      .accounts({
        task: taskPda,
        participantRecord: participantRecordPda,
        participant: participant.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([participant])
      .rpc();

    const participantRecord = await program.account.participantRecord.fetch(
      participantRecordPda
    );
    assert.equal(
      participantRecord.participant.toString(),
      participant.publicKey.toString()
    );
    assert.equal(participantRecord.videoUploaded, false);

    const task = await program.account.task.fetch(taskPda);
    assert.equal(task.participantCount, 1);
  });

  it("Mark video as uploaded", async () => {
    const [participantRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("participant"),
        taskPda.toBuffer(),
        participant.publicKey.toBuffer(),
      ],
      program.programId
    );

    const videoHash = "QmVideoHash123456789";

    await program.methods
      .markVideoUploaded(videoHash)
      .accounts({
        participantRecord: participantRecordPda,
        task: taskPda,
        participant: participant.publicKey,
      })
      .signers([participant])
      .rpc();

    const participantRecord = await program.account.participantRecord.fetch(
      participantRecordPda
    );
    assert.equal(participantRecord.videoUploaded, true);
    assert.equal(participantRecord.videoHash, videoHash);
  });

  it("Moderate video (approve)", async () => {
    const [participantRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("participant"),
        taskPda.toBuffer(),
        participant.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .moderateVideo(true)
      .accounts({
        platformConfig: platformConfigPda,
        participantRecord: participantRecordPda,
        task: taskPda,
        moderator: authority.publicKey,
      })
      .rpc();

    const participantRecord = await program.account.participantRecord.fetch(
      participantRecordPda
    );
    assert.equal(
      participantRecord.videoModerated.hasOwnProperty("approved"),
      true
    );
  });

  it("Choose winner and distribute rewards", async () => {
    const [participantRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("participant"),
        taskPda.toBuffer(),
        participant.publicKey.toBuffer(),
      ],
      program.programId
    );

    const ipfsMetadataUrl = "ipfs/QmMetadata123";
    const ipfsVideoUrl = "ipfs/QmVideo123";

    const winnerBalanceBefore = await provider.connection.getBalance(
      participant.publicKey
    );
    const feeRecipientBalanceBefore = await provider.connection.getBalance(
      feeRecipient.publicKey
    );

    await program.methods
      .chooseWinner(ipfsMetadataUrl, ipfsVideoUrl)
      .accounts({
        platformConfig: platformConfigPda,
        task: taskPda,
        winnerRecord: participantRecordPda,
        creator: creator.publicKey,
        winner: participant.publicKey,
        feeRecipient: feeRecipient.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const task = await program.account.task.fetch(taskPda);
    assert.equal(task.status.hasOwnProperty("completed"), true);
    assert.equal(task.winner.toString(), participant.publicKey.toString());
    assert.equal(task.ipfsMetadataUrl, ipfsMetadataUrl);

    // Verify reward was transferred
    const winnerBalanceAfter = await provider.connection.getBalance(
      participant.publicKey
    );
    assert.isAbove(winnerBalanceAfter, winnerBalanceBefore);

    // Verify fee was transferred
    const feeRecipientBalanceAfter = await provider.connection.getBalance(
      feeRecipient.publicKey
    );
    assert.isAbove(feeRecipientBalanceAfter, feeRecipientBalanceBefore);
  });

  it("Cannot participate in own task", async () => {
    const title = "Another task";
    const description = "Another description";
    const rewardAmount = 2 * anchor.web3.LAMPORTS_PER_SOL;

    const config = await program.account.platformConfig.fetch(platformConfigPda);
    const taskId = config.totalTasksCreated;

    const [newTaskPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("task"), taskId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods
      .createTask(title, description, new anchor.BN(rewardAmount))
      .accounts({
        platformConfig: platformConfigPda,
        task: newTaskPda,
        creator: creator.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const [participantRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("participant"),
        newTaskPda.toBuffer(),
        creator.publicKey.toBuffer(),
      ],
      program.programId
    );

    try {
      await program.methods
        .participate()
        .accounts({
          task: newTaskPda,
          participantRecord: participantRecordPda,
          participant: creator.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.toString(), "CreatorCannotParticipate");
    }
  });
});
