import { PublicKey } from '@solana/web3.js'
import { PROGRAM_ID, PLATFORM_CONFIG_SEED, TASK_SEED, PARTICIPANT_SEED } from './config'

/**
 * Find Platform Config PDA
 */
export function findPlatformConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PLATFORM_CONFIG_SEED)],
    PROGRAM_ID
  )
}

/**
 * Find Task PDA
 */
export function findTaskPDA(taskId: number | bigint): [PublicKey, number] {
  const taskIdBuffer = Buffer.alloc(8)
  taskIdBuffer.writeBigUInt64LE(BigInt(taskId))

  return PublicKey.findProgramAddressSync(
    [Buffer.from(TASK_SEED), taskIdBuffer],
    PROGRAM_ID
  )
}

/**
 * Find Participant Record PDA
 */
export function findParticipantPDA(
  taskPubkey: PublicKey,
  participantPubkey: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PARTICIPANT_SEED),
      taskPubkey.toBuffer(),
      participantPubkey.toBuffer(),
    ],
    PROGRAM_ID
  )
}

/**
 * Derive all PDAs for a task and participant
 */
export function deriveAllPDAs(taskId: number, participantPubkey?: PublicKey) {
  const [platformConfigPDA] = findPlatformConfigPDA()
  const [taskPDA] = findTaskPDA(taskId)

  let participantPDA: PublicKey | null = null
  if (participantPubkey) {
    [participantPDA] = findParticipantPDA(taskPDA, participantPubkey)
  }

  return {
    platformConfigPDA,
    taskPDA,
    participantPDA,
  }
}
