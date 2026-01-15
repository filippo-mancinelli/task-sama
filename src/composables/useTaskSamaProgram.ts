import { ref, computed } from 'vue'
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor'
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { useSolanaWallet } from './useSolanaWallet'
import { IDL, type Tasksama } from '@/lib/solana/idl'
import { PROGRAM_ID, RPC_ENDPOINT, COMMITMENT } from '@/lib/solana/config'
import { findPlatformConfigPDA, findTaskPDA, findParticipantPDA } from '@/lib/solana/pda'

export function useTaskSamaProgram() {
  const { wallet, connection, publicKey } = useSolanaWallet()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Create Anchor Provider
  const provider = computed(() => {
    if (!wallet.value || !publicKey.value) return null

    return new AnchorProvider(
      connection.value,
      wallet.value as any,
      { commitment: COMMITMENT }
    )
  })

  // Create Program instance
  const program = computed(() => {
    if (!provider.value) return null
    return new Program<Tasksama>(IDL as Tasksama, PROGRAM_ID, provider.value)
  })

  /**
   * Fetch Platform Config
   */
  const fetchPlatformConfig = async () => {
    if (!program.value) throw new Error('Program not initialized')

    const [platformConfigPDA] = findPlatformConfigPDA()
    return await program.value.account.platformConfig.fetch(platformConfigPDA)
  }

  /**
   * Fetch all tasks
   */
  const fetchAllTasks = async () => {
    if (!program.value) throw new Error('Program not initialized')

    return await program.value.account.task.all()
  }

  /**
   * Fetch single task
   */
  const fetchTask = async (taskId: number) => {
    if (!program.value) throw new Error('Program not initialized')

    const [taskPDA] = findTaskPDA(taskId)
    return await program.value.account.task.fetch(taskPDA)
  }

  /**
   * Fetch participant record
   */
  const fetchParticipantRecord = async (taskId: number, participantPubkey: PublicKey) => {
    if (!program.value) throw new Error('Program not initialized')

    const [taskPDA] = findTaskPDA(taskId)
    const [participantPDA] = findParticipantPDA(taskPDA, participantPubkey)

    return await program.value.account.participantRecord.fetch(participantPDA)
  }

  /**
   * Create a new task
   */
  const createTask = async (
    title: string,
    description: string,
    rewardAmountSol: number
  ) => {
    if (!program.value || !publicKey.value) {
      throw new Error('Wallet not connected')
    }

    try {
      isLoading.value = true
      error.value = null

      const platformConfig = await fetchPlatformConfig()
      const taskId = platformConfig.totalTasksCreated

      const [platformConfigPDA] = findPlatformConfigPDA()
      const [taskPDA] = findTaskPDA(taskId.toNumber())

      const rewardAmount = new BN(rewardAmountSol * 1_000_000_000) // SOL to lamports

      const tx = await program.value.methods
        .createTask(title, description, rewardAmount)
        .accounts({
          platformConfig: platformConfigPDA,
          task: taskPDA,
          creator: publicKey.value,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      return { signature: tx, taskId: taskId.toNumber(), taskPDA }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Participate in a task
   */
  const participateInTask = async (taskId: number) => {
    if (!program.value || !publicKey.value) {
      throw new Error('Wallet not connected')
    }

    try {
      isLoading.value = true
      error.value = null

      const [taskPDA] = findTaskPDA(taskId)
      const [participantPDA] = findParticipantPDA(taskPDA, publicKey.value)

      const tx = await program.value.methods
        .participate()
        .accounts({
          task: taskPDA,
          participantRecord: participantPDA,
          participant: publicKey.value,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      return { signature: tx, participantPDA }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Mark video as uploaded
   */
  const markVideoUploaded = async (taskId: number, videoHash: string) => {
    if (!program.value || !publicKey.value) {
      throw new Error('Wallet not connected')
    }

    try {
      isLoading.value = true
      error.value = null

      const [taskPDA] = findTaskPDA(taskId)
      const [participantPDA] = findParticipantPDA(taskPDA, publicKey.value)

      const tx = await program.value.methods
        .markVideoUploaded(videoHash)
        .accounts({
          participantRecord: participantPDA,
          task: taskPDA,
          participant: publicKey.value,
        })
        .rpc()

      return { signature: tx }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Choose winner
   */
  const chooseWinner = async (
    taskId: number,
    winnerPubkey: PublicKey,
    ipfsMetadataUrl: string,
    ipfsVideoUrl: string
  ) => {
    if (!program.value || !publicKey.value) {
      throw new Error('Wallet not connected')
    }

    try {
      isLoading.value = true
      error.value = null

      const platformConfig = await fetchPlatformConfig()
      const [platformConfigPDA] = findPlatformConfigPDA()
      const [taskPDA] = findTaskPDA(taskId)
      const [winnerRecordPDA] = findParticipantPDA(taskPDA, winnerPubkey)

      const tx = await program.value.methods
        .chooseWinner(ipfsMetadataUrl, ipfsVideoUrl)
        .accounts({
          platformConfig: platformConfigPDA,
          task: taskPDA,
          winnerRecord: winnerRecordPDA,
          creator: publicKey.value,
          winner: winnerPubkey,
          feeRecipient: platformConfig.feeRecipient,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      return { signature: tx }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cancel task
   */
  const cancelTask = async (taskId: number) => {
    if (!program.value || !publicKey.value) {
      throw new Error('Wallet not connected')
    }

    try {
      isLoading.value = true
      error.value = null

      const [taskPDA] = findTaskPDA(taskId)

      const tx = await program.value.methods
        .cancelTask()
        .accounts({
          task: taskPDA,
          creator: publicKey.value,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      return { signature: tx }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    program,
    provider,
    isLoading,
    error,

    // Methods
    fetchPlatformConfig,
    fetchAllTasks,
    fetchTask,
    fetchParticipantRecord,
    createTask,
    participateInTask,
    markVideoUploaded,
    chooseWinner,
    cancelTask,
  }
}
