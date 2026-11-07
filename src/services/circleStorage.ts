import type { LearningCircle } from '../types/dashboard'
import { circleCategories, circleDifficulties } from '../data/mockData'

const STORAGE_KEY = 'skillbridge.created-learning-circles'

function isLearningCircle(value: unknown): value is LearningCircle {
  if (!value || typeof value !== 'object') {
    return false
  }

  const circle = value as Partial<LearningCircle>
  return typeof circle.id === 'string'
    && typeof circle.name === 'string'
    && typeof circle.description === 'string'
    && typeof circle.category === 'string'
    && circleCategories.includes(circle.category)
    && typeof circle.difficulty === 'string'
    && circleDifficulties.includes(circle.difficulty)
    && typeof circle.creator === 'string'
    && typeof circle.members === 'number'
    && typeof circle.capacity === 'number'
    && typeof circle.goal === 'string'
    && typeof circle.schedule === 'string'
    && typeof circle.duration === 'string'
    && typeof circle.createdAt === 'string'
    && typeof circle.progress === 'number'
    && typeof circle.featured === 'boolean'
}

export function getCreatedLearningCircles(): LearningCircle[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }

    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.warn('SkillBridge circle storage contains an invalid value.')
      return []
    }

    return parsed.filter(isLearningCircle)
  } catch (error) {
    console.warn('SkillBridge local demo storage is unavailable or invalid.', error)
    return []
  }
}

export function saveCreatedLearningCircle(circle: LearningCircle): boolean {
  try {
    const circles = getCreatedLearningCircles()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...circles, circle]))
    return true
  } catch (error) {
    console.error('Unable to save this circle to local demo storage.', error)
    return false
  }
}
