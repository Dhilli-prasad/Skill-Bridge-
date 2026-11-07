import { learningRoadmaps } from '../data/learningRoadmapMockData'
import type { LearningRoadmapProgress } from '../types/dashboard'
import { COMMUNITY_CHANGED_EVENT } from './communityService'

const PROGRESS_KEY = 'skillbridge.learning-roadmap-progress'

function isProgress(value: unknown): value is LearningRoadmapProgress {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<LearningRoadmapProgress>
  return typeof item.roadmapId === 'string' && Array.isArray(item.completedMilestoneIds)
    && item.completedMilestoneIds.every((id) => typeof id === 'string')
    && (item.completedMilestoneAt === undefined || (typeof item.completedMilestoneAt === 'object' && item.completedMilestoneAt !== null && Object.values(item.completedMilestoneAt).every((timestamp) => typeof timestamp === 'string')))
    && (item.lastAccessedAt === undefined || typeof item.lastAccessedAt === 'string')
}

function readProgress() {
  try {
    const stored = window.localStorage.getItem(PROGRESS_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.warn('SkillBridge roadmap progress storage contains an invalid value.')
      return []
    }
    return parsed.filter(isProgress)
  } catch (error) {
    console.warn('SkillBridge roadmap progress storage is unavailable or invalid.', error)
    return []
  }
}

function saveProgress(value: LearningRoadmapProgress[]) {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent(COMMUNITY_CHANGED_EVENT))
    return true
  } catch (error) {
    console.error('Unable to update SkillBridge roadmap progress storage.', error)
    return false
  }
}

export function getLearningRoadmaps() { return learningRoadmaps }
export function getLearningRoadmap(id: string) { return learningRoadmaps.find((roadmap) => roadmap.id === id) }
export function getRoadmapProgress(id: string) {
  return readProgress().find((progress) => progress.roadmapId === id)
}
export function getRoadmapPercent(id: string) {
  const roadmap = getLearningRoadmap(id)
  const progress = getRoadmapProgress(id)
  if (!roadmap || !progress || roadmap.milestones.length === 0) return 0
  return Math.round((progress.completedMilestoneIds.length / roadmap.milestones.length) * 100)
}
export function startRoadmap(id: string) {
  const roadmap = getLearningRoadmap(id)
  if (!roadmap) return { ok: false as const, message: 'Roadmap not found.' }
  const existing = getRoadmapProgress(id)
  const next = readProgress().filter((item) => item.roadmapId !== id)
  next.push({ roadmapId: id, completedMilestoneIds: existing?.completedMilestoneIds ?? [], completedMilestoneAt: existing?.completedMilestoneAt ?? {}, lastAccessedAt: new Date().toISOString() })
  return saveProgress(next) ? { ok: true as const, message: existing ? 'Roadmap resumed.' : 'Roadmap started.' } : { ok: false as const, message: 'We could not save roadmap progress.' }
}
export function completeRoadmapMilestone(id: string, milestoneId: string) {
  const roadmap = getLearningRoadmap(id)
  const existing = getRoadmapProgress(id)
  if (!roadmap || !existing) return { ok: false as const, message: 'Start this roadmap before completing milestones.' }
  const index = roadmap.milestones.findIndex((milestone) => milestone.id === milestoneId)
  if (index < 0) return { ok: false as const, message: 'Milestone not found.' }
  const previous = roadmap.milestones[index - 1]
  if (previous && !existing.completedMilestoneIds.includes(previous.id)) return { ok: false as const, message: 'Complete the previous milestone first.' }
  const updated = { ...existing, completedMilestoneIds: [...new Set([...existing.completedMilestoneIds, milestoneId])], completedMilestoneAt: { ...existing.completedMilestoneAt, [milestoneId]: existing.completedMilestoneAt?.[milestoneId] ?? new Date().toISOString() }, lastAccessedAt: new Date().toISOString() }
  return saveProgress(readProgress().map((item) => item.roadmapId === id ? updated : item)) ? { ok: true as const, message: 'Milestone completed.' } : { ok: false as const, message: 'We could not save milestone progress.' }
}
