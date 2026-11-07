import { COMMUNITY_CHANGED_EVENT, COMMUNITY_USER_ID } from './communityService'

export interface ArenaProgress {
  developerId: string
  solvedChallengeIds: string[]
  attempts: { challengeId: string; submittedAt: string; passed: boolean }[]
  points: number
}

const KEY = 'skillbridge.code-arena-progress'

function isProgress(value: unknown): value is ArenaProgress {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<ArenaProgress>
  return typeof item.developerId === 'string' && Array.isArray(item.solvedChallengeIds) && Array.isArray(item.attempts)
    && item.solvedChallengeIds.every((id) => typeof id === 'string') && item.attempts.every((attempt) => Boolean(attempt) && typeof attempt === 'object') && typeof item.points === 'number'
}

function read(): ArenaProgress {
  try {
    const stored = window.localStorage.getItem(KEY)
    const parsed: unknown = stored ? JSON.parse(stored) : null
    return isProgress(parsed) ? parsed : { developerId: COMMUNITY_USER_ID, solvedChallengeIds: [], attempts: [], points: 0 }
  } catch {
    return { developerId: COMMUNITY_USER_ID, solvedChallengeIds: [], attempts: [], points: 0 }
  }
}

function save(progress: ArenaProgress) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(progress))
    window.dispatchEvent(new CustomEvent(COMMUNITY_CHANGED_EVENT))
  } catch {
    // Local persistence is best effort for this frontend demo.
  }
}

export function getArenaProgress() { return read() }

export function recordArenaAttempt(challengeId: string, passed: boolean, points: number) {
  const current = read()
  const solved = passed && !current.solvedChallengeIds.includes(challengeId)
  const next: ArenaProgress = {
    ...current,
    solvedChallengeIds: solved ? [...current.solvedChallengeIds, challengeId] : current.solvedChallengeIds,
    attempts: [{ challengeId, submittedAt: new Date().toISOString(), passed }, ...current.attempts].slice(0, 50),
    points: current.points + (solved ? points : 0),
  }
  save(next)
  return next
}
