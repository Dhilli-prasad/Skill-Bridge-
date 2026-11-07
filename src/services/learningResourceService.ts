import { learningResources } from '../data/learningResourceMockData'
import type { LearningResource } from '../types/dashboard'
import { COMMUNITY_CHANGED_EVENT } from './communityService'

const SAVED_RESOURCES_KEY = 'skillbridge.learning-saved-resources'
const isResource = (value: unknown): value is LearningResource => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<LearningResource>
  return typeof item.id === 'string' && typeof item.title === 'string' && typeof item.description === 'string'
    && typeof item.type === 'string' && Array.isArray(item.tags) && item.tags.every((tag) => typeof tag === 'string')
    && typeof item.difficulty === 'string' && typeof item.publisher === 'string' && typeof item.duration === 'string' && typeof item.createdAt === 'string'
}

function readSaved() {
  try {
    const stored = window.localStorage.getItem(SAVED_RESOURCES_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.warn('SkillBridge saved resource storage contains an invalid value.')
      return []
    }
    return [...new Set(parsed.filter((value): value is string => typeof value === 'string'))]
  } catch (error) {
    console.warn('SkillBridge saved resource storage is unavailable or invalid.', error)
    return []
  }
}

function save(ids: string[]) {
  try {
    window.localStorage.setItem(SAVED_RESOURCES_KEY, JSON.stringify(ids))
    window.dispatchEvent(new CustomEvent(COMMUNITY_CHANGED_EVENT))
    return true
  } catch (error) {
    console.error('Unable to update SkillBridge saved resource storage.', error)
    return false
  }
}

export function getLearningResources() { return learningResources.filter(isResource) }
export function getLearningResource(id: string) { return getLearningResources().find((resource) => resource.id === id) }
export function getResourcesForPath(pathId: string) { return getLearningResources().filter((resource) => resource.relatedPathId === pathId) }
export function getSavedLearningResources() { return readSaved().map((id) => getLearningResource(id)).filter((resource): resource is LearningResource => Boolean(resource)) }
export function isLearningResourceSaved(id: string) { return readSaved().includes(id) }
export function getSavedLearningResourceCount() { return getSavedLearningResources().length }
export function toggleSavedLearningResource(id: string) {
  if (!getLearningResource(id)) return { ok: false as const, message: 'Learning resource not found.' }
  const saved = readSaved()
  const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id]
  return save(next) ? { ok: true as const, message: saved.includes(id) ? 'Resource removed from saved items.' : 'Resource saved.' } : { ok: false as const, message: 'We could not update saved resources.' }
}
