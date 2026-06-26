// Fictitious data used when the Solana program is not deployed (demo mode).
// Task ids align with the seeded backend (task_images / comments / likes for ids 1-3),
// so the off-chain data fetched from the API lines up with these mock tasks.

const SOL = 1_000_000_000

const now = Math.floor(Date.now() / 1000)
const days = (n: number) => now - n * 86_400

// Solana base58 wallet addresses (same set as the backend seed)
const SATOSHI = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
const PIXEL = '9aE8sT2rNvQp4mWcG7uYbF3kLxZ1dHnJ5sRtVePqA6B'
const SMITH = 'FhRfMk3pQ2nWcVtY8uJbL1xZ9dHs7gKaE4rTpNvQ6Sm'

export const DEMO_PLATFORM_CONFIG = {
  authority: SATOSHI,
  feeRecipient: SATOSHI,
  feePercentage: 5,
  minimumReward: 1 * SOL,
  totalTasksCreated: 3,
  totalTasksCompleted: 1,
}

export const DEMO_TASKS = [
  {
    taskId: 2,
    pda: 'DemoTaskPDA2example2example2example2example2A',
    creator: PIXEL,
    title: 'Design a logo',
    description: 'Create a modern, minimal logo for a Solana-native bounty platform. SVG + PNG deliverables.',
    rewardAmount: 3 * SOL,
    feeAmount: 0.15 * SOL,
    status: 'Active' as const,
    createdAt: days(1),
    participantCount: 2,
  },
  {
    taskId: 3,
    pda: 'DemoTaskPDA3example3example3example3example3A',
    creator: SMITH,
    title: 'Record a jingle',
    description: 'Compose a 10-second audio jingle for the brand. Royalty-free, delivered as WAV + MP3.',
    rewardAmount: 1.5 * SOL,
    feeAmount: 0.075 * SOL,
    status: 'Active' as const,
    createdAt: days(2),
    participantCount: 1,
  },
  {
    taskId: 1,
    pda: 'DemoTaskPDA1example1example1example1example1A',
    creator: SATOSHI,
    title: 'Build a landing page',
    description: 'Ship a responsive landing page with wallet connect and a tasks grid. Vue + Tailwind.',
    rewardAmount: 2 * SOL,
    feeAmount: 0.1 * SOL,
    status: 'Completed' as const,
    createdAt: days(5),
    completedAt: days(2),
    participantCount: 2,
    winner: PIXEL,
    ipfsMetadataUrl: 'https://ipfs.io/ipfs/bafkreemetadata0001example0001example0001examp',
    ipfsVideoUrl: 'https://ipfs.io/ipfs/bafybvideo0001example0001example0001example001',
  },
]

export function getDemoTask(taskId: number) {
  return DEMO_TASKS.find((t) => t.taskId === taskId)
}
