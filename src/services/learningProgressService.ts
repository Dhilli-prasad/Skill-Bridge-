import { COMMUNITY_CHANGED_EVENT } from './communityService'

const GOAL_KEY = 'skillbridge.learning-weekly-goal'
const DEFAULT_GOAL = 3

export function getWeeklyLessonGoal() {
  try {
    const stored = window.localStorage.getItem(GOAL_KEY)
    const value = Number(stored)
    return Number.isInteger(value) && value >= 1 && value <= 50 ? value : DEFAULT_GOAL
  } catch (error) {
    console.warn('SkillBridge weekly goal storage is unavailable or invalid.', error)
    return DEFAULT_GOAL
  }
}

export function setWeeklyLessonGoal(goal: number) {
  if (!Number.isInteger(goal) || goal < 1 || goal > 50) return { ok: false as const, message: 'Choose a goal between 1 and 50 lessons.' }
  try {
    window.localStorage.setItem(GOAL_KEY, String(goal))
    window.dispatchEvent(new CustomEvent(COMMUNITY_CHANGED_EVENT))
    return { ok: true as const }
  } catch (error) {
    console.error('Unable to save SkillBridge weekly goal.', error)
    return { ok: false as const, message: 'We could not save your weekly goal.' }
  }
}
