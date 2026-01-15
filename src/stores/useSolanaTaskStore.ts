import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PublicKey } from '@solana/web3.js'
import { useTaskSamaProgram } from '@/composables/useTaskSamaProgram'
import { lamportsToSol, formatTimestamp } from '@/lib/solana/utils'
import axios from 'axios'

interface Task {
  taskId: number
  pda: string
  creator: string
  title: string
  description: string
  rewardAmount: number
  feeAmount: number
  status: 'Active' | 'Completed' | 'Cancelled'
  createdAt: number
  completedAt?: number
  participantCount: number
  winner?: string
  ipfsMetadataUrl?: string
  ipfsVideoUrl?: string
}

interface ParticipantRecord {
  taskId: number
  participant: string
  participatedAt: number
  videoUploaded: boolean
  videoHash?: string
  videoModerated: 'Pending' | 'Approved' | 'Rejected'
}

export const useSolanaTaskStore = defineStore('solanaTask', () => {
  const programComposable = useTaskSamaProgram()

  // State
  const tasks = ref<Task[]>([])
  const currentTask = ref<Task | null>(null)
  const participantRecords = ref<Map<string, ParticipantRecord>>(new Map())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Platform config
  const platformConfig = ref<any>(null)

  // Computed
  const activeTasks = computed(() =>
    tasks.value.filter(task => task.status === 'Active')
  )

  const completedTasks = computed(() =>
    tasks.value.filter(task => task.status === 'Completed')
  )

  const tasksCount = computed(() => tasks.value.length)

  // Fetch platform config
  async function fetchPlatformConfig() {
    try {
      isLoading.value = true
      error.value = null

      const config = await programComposable.fetchPlatformConfig()
      platformConfig.value = {
        authority: config.authority.toBase58(),
        feeRecipient: config.feeRecipient.toBase58(),
        feePercentage: config.feePercentage,
        minimumReward: config.minimumReward.toNumber(),
        totalTasksCreated: config.totalTasksCreated.toNumber(),
        totalTasksCompleted: config.totalTasksCompleted.toNumber(),
      }

      return platformConfig.value
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Fetch all tasks
  async function fetchTasks() {
    try {
      isLoading.value = true
      error.value = null

      const tasksData = await programComposable.fetchAllTasks()

      tasks.value = tasksData.map((item: any) => ({
        taskId: item.account.taskId.toNumber(),
        pda: item.publicKey.toBase58(),
        creator: item.account.creator.toBase58(),
        title: item.account.title,
        description: item.account.description,
        rewardAmount: item.account.rewardAmount.toNumber(),
        feeAmount: item.account.feeAmount.toNumber(),
        status: Object.keys(item.account.status)[0] as any,
        createdAt: item.account.createdAt.toNumber(),
        completedAt: item.account.completedAt?.toNumber(),
        participantCount: item.account.participantCount,
        winner: item.account.winner?.toBase58(),
        ipfsMetadataUrl: item.account.ipfsMetadataUrl,
        ipfsVideoUrl: item.account.ipfsVideoUrl,
      }))

      return tasks.value
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Fetch single task
  async function fetchTask(taskId: number) {
    try {
      isLoading.value = true
      error.value = null

      const taskData = await programComposable.fetchTask(taskId)

      const task: Task = {
        taskId: taskData.taskId.toNumber(),
        pda: '', // Will be set from PDA derivation
        creator: taskData.creator.toBase58(),
        title: taskData.title,
        description: taskData.description,
        rewardAmount: taskData.rewardAmount.toNumber(),
        feeAmount: taskData.feeAmount.toNumber(),
        status: Object.keys(taskData.status)[0] as any,
        createdAt: taskData.createdAt.toNumber(),
        completedAt: taskData.completedAt?.toNumber(),
        participantCount: taskData.participantCount,
        winner: taskData.winner?.toBase58(),
        ipfsMetadataUrl: taskData.ipfsMetadataUrl,
        ipfsVideoUrl: taskData.ipfsVideoUrl,
      }

      currentTask.value = task
      return task
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Create task
  async function createTask(title: string, description: string, rewardSol: number) {
    try {
      isLoading.value = true
      error.value = null

      const result = await programComposable.createTask(title, description, rewardSol)

      // Refresh tasks
      await fetchTasks()

      return result
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Participate in task
  async function participate(taskId: number) {
    try {
      isLoading.value = true
      error.value = null

      const result = await programComposable.participateInTask(taskId)

      // Refresh task
      await fetchTask(taskId)

      return result
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Upload video to backend
  async function uploadVideo(taskId: number, file: File) {
    try {
      isLoading.value = true
      error.value = null

      const formData = new FormData()
      formData.append('file', file)
      formData.append('taskId', taskId.toString())

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/uploadVideoToDB`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )

      // Mark video as uploaded on-chain
      const videoHash = response.data.data.path // or generate hash
      await programComposable.markVideoUploaded(taskId, videoHash)

      return response.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Choose winner
  async function chooseWinner(
    taskId: number,
    winnerAddress: string,
    ipfsMetadataUrl: string,
    ipfsVideoUrl: string
  ) {
    try {
      isLoading.value = true
      error.value = null

      const winnerPubkey = new PublicKey(winnerAddress)
      const result = await programComposable.chooseWinner(
        taskId,
        winnerPubkey,
        ipfsMetadataUrl,
        ipfsVideoUrl
      )

      // Refresh task
      await fetchTask(taskId)

      return result
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Cancel task
  async function cancelTask(taskId: number) {
    try {
      isLoading.value = true
      error.value = null

      const result = await programComposable.cancelTask(taskId)

      // Refresh tasks
      await fetchTasks()

      return result
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get task by ID
  function getTaskById(taskId: number): Task | undefined {
    return tasks.value.find(task => task.taskId === taskId)
  }

  // Format task for display
  function formatTaskForDisplay(task: Task) {
    return {
      ...task,
      rewardSol: lamportsToSol(task.rewardAmount),
      createdAtFormatted: formatTimestamp(task.createdAt),
      completedAtFormatted: task.completedAt ? formatTimestamp(task.completedAt) : null,
    }
  }

  return {
    // State
    tasks,
    currentTask,
    participantRecords,
    isLoading,
    error,
    platformConfig,

    // Computed
    activeTasks,
    completedTasks,
    tasksCount,

    // Methods
    fetchPlatformConfig,
    fetchTasks,
    fetchTask,
    createTask,
    participate,
    uploadVideo,
    chooseWinner,
    cancelTask,
    getTaskById,
    formatTaskForDisplay,
  }
})
