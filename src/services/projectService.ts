import { collaborationProjects } from '../data/projectMockData'
import { COMMUNITY_CHANGED_EVENT, COMMUNITY_USER_ID } from './communityService'
import type { CollaborationProject, ProjectRole } from '../types/dashboard'

const MEMBERS_KEY = 'skillbridge.project-members'
const PROJECTS_KEY = 'skillbridge.projects'
interface Membership { projectId: string; userId: string; joinedAt: string; role: Exclude<ProjectRole, 'Owner'> }

function isMembership(value: unknown): value is Membership {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Membership>
  return typeof item.projectId === 'string' && typeof item.userId === 'string' && typeof item.joinedAt === 'string'
    && (item.role === undefined || ['Developer', 'Designer', 'Tester', 'Contributor'].includes(item.role))
}

function readMemberships() {
  try {
    const stored = window.localStorage.getItem(MEMBERS_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    const unique = new Map<string, Membership>()
    parsed.filter(isMembership).forEach((item) => unique.set(`${item.projectId}:${item.userId}`, { ...item, role: item.role ?? 'Contributor' }))
    return [...unique.values()]
  } catch (error) {
    console.warn('SkillBridge project membership storage is unavailable or invalid.', error)
    return []
  }
}

function saveMemberships(memberships: Membership[]) {
  try {
    window.localStorage.setItem(MEMBERS_KEY, JSON.stringify(memberships))
    window.dispatchEvent(new CustomEvent(COMMUNITY_CHANGED_EVENT))
    return true
  } catch (error) {
    console.error('Unable to update SkillBridge project memberships.', error)
    return false
  }
}

function isProject(value: unknown): value is CollaborationProject {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<import('../types/dashboard').CollaborationProject>
  return typeof project.id === 'string' && typeof project.title === 'string' && typeof project.description === 'string'
    && typeof project.fullDescription === 'string' && Array.isArray(project.goals) && project.goals.every((item) => typeof item === 'string')
    && Array.isArray(project.outcomes) && project.outcomes.every((item) => typeof item === 'string') && typeof project.ownerId === 'string'
    && Array.isArray(project.technology) && project.technology.every((item) => typeof item === 'string') && typeof project.category === 'string'
    && typeof project.difficulty === 'string' && Array.isArray(project.requiredRoles) && project.requiredRoles.every((item) => typeof item === 'string')
    && Array.isArray(project.memberIds) && project.memberIds.every((item) => typeof item === 'string') && Number.isInteger(project.capacity)
    && project.capacity !== undefined && project.capacity >= 1 && typeof project.status === 'string' && typeof project.createdAt === 'string'
    && (project.repositoryUrl === undefined || typeof project.repositoryUrl === 'string')
}

function storedProjects() {
  try {
    const stored = window.localStorage.getItem(PROJECTS_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.warn('SkillBridge project storage contains an invalid value.')
      return []
    }
    return parsed.filter(isProject)
  } catch (error) {
    console.warn('SkillBridge project storage is unavailable or invalid.', error)
    return []
  }
}

function saveProjects(projects: CollaborationProject[]) {
  try {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
    window.dispatchEvent(new CustomEvent(COMMUNITY_CHANGED_EVENT))
    return true
  } catch (error) {
    console.error('Unable to update SkillBridge project storage.', error)
    return false
  }
}

export function getProjects() {
  const memberships = readMemberships()
  const stored = new Map(storedProjects().map((project) => [project.id, project]))
  return [...collaborationProjects.filter((project) => !stored.has(project.id)), ...storedProjects()].map((project) => ({ ...project, memberIds: [...new Set([...project.memberIds, ...memberships.filter((item) => item.projectId === project.id).map((item) => item.userId)])] }))
}
export function getProject(id: string) { return getProjects().find((project) => project.id === id) }
export function isProjectMember(id: string) { return getProject(id)?.memberIds.includes(COMMUNITY_USER_ID) ?? false }
export function getProjectMemberRole(projectId: string, userId: string) {
  const project = getProject(projectId)
  if (project?.ownerId === userId) return 'Owner' as const
  return readMemberships().find((item) => item.projectId === projectId && item.userId === userId)?.role
}

export function getProjectMemberships(projectId: string) {
  const project = getProject(projectId)
  if (!project) return []
  return project.memberIds.map((userId) => ({ userId, role: getProjectMemberRole(projectId, userId) ?? 'Contributor' as ProjectRole }))
}

export function joinProject(id: string, role: Exclude<ProjectRole, 'Owner'> = 'Contributor') {
  const project = getProject(id)
  if (!project) return { ok: false as const, message: 'Project not found.' }
  if (project.status !== 'Recruiting') return { ok: false as const, message: 'This project is no longer recruiting.' }
  if (project.memberIds.includes(COMMUNITY_USER_ID)) return { ok: false as const, message: 'You are already part of this project.' }
  if (project.memberIds.length >= project.capacity) return { ok: false as const, message: 'This project is full.' }
  const memberships = readMemberships()
  memberships.push({ projectId: id, userId: COMMUNITY_USER_ID, role, joinedAt: new Date().toISOString() })
  return saveMemberships(memberships) ? { ok: true as const, message: 'You joined the project.' } : { ok: false as const, message: 'We could not save your project membership.' }
}

export function getProjectsForUser(userId = COMMUNITY_USER_ID) {
  return getProjects().filter((project) => project.ownerId === userId || project.memberIds.includes(userId))
}

export function leaveProject(id: string) {
  const project = getProject(id)
  if (!project) return { ok: false as const, message: 'Project not found.' }
  if (project.ownerId === COMMUNITY_USER_ID) return { ok: false as const, message: 'Owners cannot leave their own project.' }
  if (!project.memberIds.includes(COMMUNITY_USER_ID)) return { ok: false as const, message: 'You are not a member of this project.' }
  return saveMemberships(readMemberships().filter((item) => !(item.projectId === id && item.userId === COMMUNITY_USER_ID)))
    ? { ok: true as const, message: 'You left the project.' }
    : { ok: false as const, message: 'We could not update your membership.' }
}

export function removeProjectMember(projectId: string, userId: string) {
  const project = getProject(projectId)
  if (!project) return { ok: false as const, message: 'Project not found.' }
  if (project.ownerId !== COMMUNITY_USER_ID) return { ok: false as const, message: 'Only the project owner can manage members.' }
  if (userId === project.ownerId) return { ok: false as const, message: 'The project owner cannot be removed.' }
  if (!project.memberIds.includes(userId)) return { ok: false as const, message: 'Member not found.' }
  return saveMemberships(readMemberships().filter((item) => !(item.projectId === projectId && item.userId === userId)))
    ? { ok: true as const, message: 'Member removed.' }
    : { ok: false as const, message: 'We could not remove this member.' }
}

export function updateProjectMemberRole(projectId: string, userId: string, role: Exclude<ProjectRole, 'Owner'>) {
  const project = getProject(projectId)
  if (!project) return { ok: false as const, message: 'Project not found.' }
  if (project.ownerId !== COMMUNITY_USER_ID) return { ok: false as const, message: 'Only the project owner can manage roles.' }
  if (userId === project.ownerId) return { ok: false as const, message: 'The owner role cannot be changed.' }
  if (!project.memberIds.includes(userId)) return { ok: false as const, message: 'Member not found.' }
  const next = readMemberships().map((item) => item.projectId === projectId && item.userId === userId ? { ...item, role } : item)
  return saveMemberships(next) ? { ok: true as const, message: 'Member role updated.' } : { ok: false as const, message: 'We could not update this role.' }
}

export interface ProjectInput {
  title: string
  description: string
  fullDescription: string
  category: string
  difficulty: import('../types/dashboard').LearningDifficulty
  technology: string[]
  goals: string[]
  outcomes: string[]
  requiredRoles: string[]
  capacity: number
  repositoryUrl?: string
  status: import('../types/dashboard').ProjectStatus
}

function validateInput(input: ProjectInput, currentMemberCount = 1) {
  if (!input.title.trim() || !input.description.trim()) return 'Project title and short description are required.'
  if (!input.category.trim() || !input.fullDescription.trim()) return 'Project category and full description are required.'
  if (!input.technology.length || !input.goals.length || !input.outcomes.length || !input.requiredRoles.length) return 'Add at least one technology, goal, outcome, and required role.'
  if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 50 || input.capacity < currentMemberCount) return `Team capacity must be between ${currentMemberCount} and 50 members.`
  if (input.repositoryUrl && !/^https?:\/\/\S+$/i.test(input.repositoryUrl)) return 'Repository URL must begin with http:// or https://.'
  return undefined
}

export function createProject(input: ProjectInput) {
  const error = validateInput(input)
  if (error) return { ok: false as const, message: error }
  const project = { ...input, id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ownerId: COMMUNITY_USER_ID, memberIds: [COMMUNITY_USER_ID], createdAt: new Date().toISOString() }
  return saveProjects([...storedProjects(), project]) ? { ok: true as const, message: 'Project created.', project } : { ok: false as const, message: 'We could not save your project.' }
}

export function updateProject(id: string, input: ProjectInput) {
  const project = getProject(id)
  if (!project) return { ok: false as const, message: 'Project not found.' }
  if (project.ownerId !== COMMUNITY_USER_ID) return { ok: false as const, message: 'Only the project owner can edit this project.' }
  const error = validateInput(input, project.memberIds.length)
  if (error) return { ok: false as const, message: error }
  const updated = { ...project, ...input, memberIds: project.memberIds }
  const stored = storedProjects().filter((item) => item.id !== id)
  return saveProjects([...stored, updated]) ? { ok: true as const, message: 'Project updated.', project: updated } : { ok: false as const, message: 'We could not save your project changes.' }
}

export function deleteProject(id: string) {
  const project = getProject(id)
  if (!project) return { ok: false as const, message: 'Project not found.' }
  if (project.ownerId !== COMMUNITY_USER_ID) return { ok: false as const, message: 'Only the project owner can delete this project.' }
  return saveProjects(storedProjects().filter((item) => item.id !== id)) ? { ok: true as const, message: 'Project deleted.' } : { ok: false as const, message: 'We could not delete your project.' }
}
