import { learningPaths } from '../data/learningMockData'
import type { LearningEnrollment } from '../types/dashboard'
import { COMMUNITY_CHANGED_EVENT } from './communityService'
import { getSavedLearningResourceCount } from './learningResourceService'

const ENROLLMENTS_KEY = 'skillbridge.learning-enrollments'
const SAVED_KEY = 'skillbridge.learning-saved'

function isEnrollment(value: unknown): value is LearningEnrollment {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<LearningEnrollment>
  return typeof item.pathId === 'string' && typeof item.progress === 'number' && item.progress >= 0 && item.progress <= 100
    && (item.completedLessonIds === undefined || (Array.isArray(item.completedLessonIds) && item.completedLessonIds.every((id) => typeof id === 'string')))
    && (item.completedLessonAt === undefined || (typeof item.completedLessonAt === 'object' && item.completedLessonAt !== null && Object.values(item.completedLessonAt).every((timestamp) => typeof timestamp === 'string')))
    && (item.lastAccessedAt === undefined || typeof item.lastAccessedAt === 'string')
    && (item.completedAt === undefined || typeof item.completedAt === 'string')
}

function read<T>(key: string, guard: (value: unknown) => value is T, label: string): T[] {
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.warn(`SkillBridge ${label} storage contains an invalid value.`)
      return []
    }
    return parsed.filter(guard)
  } catch (error) {
    console.warn(`SkillBridge ${label} storage is unavailable or invalid.`, error)
    return []
  }
}

function save(key: string, value: unknown, label: string) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent(COMMUNITY_CHANGED_EVENT))
    return true
  } catch (error) {
    console.error(`Unable to update SkillBridge ${label} storage.`, error)
    return false
  }
}

const storedEnrollments = () => {
  const unique = new Map<string, LearningEnrollment>()
  read(ENROLLMENTS_KEY, isEnrollment, 'learning enrollment').forEach((item) => unique.set(item.pathId, { ...item, completedLessonIds: item.completedLessonIds ?? [], completedLessonAt: item.completedLessonAt ?? {} }))
  return [...unique.values()]
}

const storedSaved = () => [...new Set(read(SAVED_KEY, (value): value is string => typeof value === 'string', 'saved learning resources'))]

export function getLearningPaths() { return learningPaths }
export function getLearningPath(id: string) { return learningPaths.find((path) => path.id === id) }
export function getLearningEnrollments() { return storedEnrollments().filter((item) => Boolean(getLearningPath(item.pathId))) }
export function getLearningEnrollment(pathId: string) { return getLearningEnrollments().find((item) => item.pathId === pathId) }
export function getSavedLearningCount() { return storedSaved().filter((id) => Boolean(getLearningPath(id))).length + getSavedLearningResourceCount() }
export function isLearningPathSaved(pathId: string) { return storedSaved().includes(pathId) }

export function toggleSavedLearningPath(pathId: string) {
  if (!getLearningPath(pathId)) return { ok: false as const, message: 'Learning path not found.' }
  const saved = storedSaved()
  const next = saved.includes(pathId) ? saved.filter((id) => id !== pathId) : [...saved, pathId]
  return save(SAVED_KEY, next, 'saved learning resources') ? { ok: true as const, message: saved.includes(pathId) ? 'Removed from saved resources.' : 'Saved learning path.' } : { ok: false as const, message: 'We could not update saved resources.' }
}

export function startLearningPath(pathId: string) {
  const path = getLearningPath(pathId)
  if (!path) return { ok: false as const, message: 'Learning path not found.' }
  const existing = getLearningEnrollment(pathId)
  const enrollment: LearningEnrollment = { pathId, progress: existing?.progress ?? 0, lastAccessedAt: new Date().toISOString(), completedAt: existing?.completedAt, completedLessonIds: existing?.completedLessonIds ?? [], completedLessonAt: existing?.completedLessonAt ?? {} }
  const next = [...storedEnrollments().filter((item) => item.pathId !== pathId), enrollment]
  return save(ENROLLMENTS_KEY, next, 'learning enrollment') ? { ok: true as const, message: existing ? 'Learning path resumed.' : 'Learning path started.', enrollment } : { ok: false as const, message: 'We could not save your learning progress.' }
}

export function leaveLearningPath(pathId: string) {
  if (!getLearningEnrollment(pathId)) return { ok: false as const, message: 'You are not enrolled in this learning path.' }
  return save(ENROLLMENTS_KEY, storedEnrollments().filter((item) => item.pathId !== pathId), 'learning enrollment')
    ? { ok: true as const, message: 'You left the learning path.' }
    : { ok: false as const, message: 'We could not update your enrollment.' }
}

export function isLessonCompleted(pathId: string, lessonId: string) {
  return getLearningEnrollment(pathId)?.completedLessonIds.includes(lessonId) ?? false
}

export function completeLearningLesson(pathId: string, lessonId: string) {
  const path = getLearningPath(pathId)
  const enrollment = getLearningEnrollment(pathId)
  if (!path || !enrollment) return { ok: false as const, message: 'Enroll in this learning path before completing lessons.' }
  const allLessons = path.modules.flatMap((item) => item.lessons)
  if (!allLessons.some((lesson) => lesson.id === lessonId)) return { ok: false as const, message: 'Lesson not found.' }
  const completedLessonIds = [...new Set([...enrollment.completedLessonIds, lessonId])]
  const progress = Math.round((completedLessonIds.length / allLessons.length) * 100)
  const completedLessonAt = { ...enrollment.completedLessonAt, [lessonId]: enrollment.completedLessonAt?.[lessonId] ?? new Date().toISOString() }
  const updated: LearningEnrollment = { ...enrollment, completedLessonIds, completedLessonAt, progress, completedAt: progress === 100 ? new Date().toISOString() : undefined, lastAccessedAt: new Date().toISOString() }
  return save(ENROLLMENTS_KEY, storedEnrollments().map((item) => item.pathId === pathId ? updated : item), 'learning enrollment')
    ? { ok: true as const, message: 'Lesson marked complete.', enrollment: updated }
    : { ok: false as const, message: 'We could not save lesson progress.' }
}
