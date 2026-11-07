import { getCircleMembers } from './circleMembership'
import { demoCircleTasks } from '../data/taskMockData'
import type { CircleTask, CreateCircleTaskInput, LearningCircle, TaskStatus } from '../types/dashboard'

export const TASKS_CHANGED_EVENT = 'skillbridge:tasks-changed'
const STORAGE_KEY = 'skillbridge.circle-tasks'

function isTask(value: unknown): value is CircleTask {
  if (!value || typeof value !== 'object') return false
  const task = value as Partial<CircleTask>
  return typeof task.id === 'string'
    && typeof task.circleId === 'string'
    && typeof task.title === 'string'
    && typeof task.description === 'string'
    && typeof task.weekNumber === 'number'
    && typeof task.dueDate === 'string'
    && (task.priority === 'Low' || task.priority === 'Medium' || task.priority === 'High')
    && (task.difficulty === 'Beginner' || task.difficulty === 'Intermediate' || task.difficulty === 'Advanced')
    && (task.assignedMemberId === undefined || typeof task.assignedMemberId === 'string')
    && typeof task.completed === 'boolean'
    && typeof task.createdBy === 'string'
    && typeof task.createdAt === 'string'
}

function getStoredTasks(): CircleTask[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.warn('SkillBridge task storage contains an invalid value.')
      return []
    }
    const seen = new Set<string>()
    return parsed.filter(isTask).filter((task) => {
      if (seen.has(task.id)) return false
      seen.add(task.id)
      return true
    })
  } catch (error) {
    console.warn('SkillBridge task storage is unavailable or invalid.', error)
    return []
  }
}

function notifyTaskChange() {
  window.dispatchEvent(new CustomEvent(TASKS_CHANGED_EVENT))
}

function saveTasks(tasks: CircleTask[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    notifyTaskChange()
    return true
  } catch (error) {
    console.error('Unable to update SkillBridge task storage.', error)
    return false
  }
}

export function getCircleTasks(circleId: string): CircleTask[] {
  const stored = getStoredTasks().filter((task) => task.circleId === circleId)
  const storedIds = new Set(stored.map((task) => task.id))
  return [...demoCircleTasks.filter((task) => task.circleId === circleId && !storedIds.has(task.id)), ...stored]
}

export function getTaskStatus(task: CircleTask, today = new Date()): TaskStatus {
  if (task.completed) return 'Completed'
  const due = new Date(`${task.dueDate}T23:59:59`)
  return due < today ? 'Overdue' : 'Pending'
}

export function canManageCircleTasks(circle: LearningCircle): boolean {
  return circle.creator === 'Aarav Kumar' || getCircleMembers(circle).some((member) => member.id === 'demo-user-aarav-kumar' && (member.role === 'Owner' || member.role === 'Moderator'))
}

export type TaskActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string }

export function createCircleTask(circle: LearningCircle, input: CreateCircleTaskInput): TaskActionResult {
  if (!canManageCircleTasks(circle)) return { ok: false, message: 'Only the circle owner or a moderator can create tasks in this demo.' }
  const tasks = getStoredTasks()
  const task: CircleTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    createdBy: 'Aarav Kumar',
    createdAt: new Date().toISOString(),
    completed: false,
  }
  return saveTasks([...tasks, task])
    ? { ok: true, message: `${task.title} was created.` }
    : { ok: false, message: 'We could not save this task in local demo storage.' }
}

export function setTaskCompleted(circle: LearningCircle, taskId: string, completed: boolean): TaskActionResult {
  const task = getCircleTasks(circle.id).find((candidate) => candidate.id === taskId)
  if (!task) return { ok: false, message: 'This task is no longer available.' }
  const tasks = getStoredTasks()
  const updated: CircleTask = { ...task, completed, completedAt: completed ? new Date().toISOString() : undefined }
  const next = tasks.some((candidate) => candidate.id === taskId)
    ? tasks.map((candidate) => candidate.id === taskId ? updated : candidate)
    : [...tasks, updated]
  return saveTasks(next)
    ? { ok: true, message: completed ? 'Task marked complete.' : 'Task marked pending.' }
    : { ok: false, message: 'We could not save the task status in local demo storage.' }
}
