import { apiRequest } from './apiClient'
import type { CollaborationProject, LearningDifficulty, ProjectRole } from '../types/dashboard'

export interface ApiProject {
  id: string; title: string; description: string; fullDescription?: string; goals?: string[]; outcomes?: string[];
  technology: string[]; category: string; difficulty: LearningDifficulty; requiredRoles: string[];
  capacity: number; createdAt: string; repositoryUrl?: string;
  memberCount: number
  status: string
}
export interface ProjectMember { projectId: string; userId: string; role: ProjectRole; joinedAt: string }
export interface JoinRequest { id: string; projectId: string; requesterId: string; role: Exclude<ProjectRole, 'Owner'>; status: 'pending' | 'approved' | 'rejected'; createdAt: string }
export interface ProjectMilestone { milestoneId: string; title: string; description: string; order: number; status: 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED'; dueDate?: string; progress?: { completedTasks: number; totalTasks: number; percentage: number } }
export interface ProjectTask { taskId: string; title: string; description: string; status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED'; priority: 'LOW' | 'MEDIUM' | 'HIGH'; milestoneId?: string; assigneeId?: string; dueDate?: string }
type Data<T> = { data: T }
type Page<T> = { data: T[]; pagination: { nextCursor?: string | null; limit: number } }

const apiMode = import.meta.env.VITE_PROJECT_COLLABORATION_MODE === 'api'
export const isProjectApiMode = () => apiMode
const auth = { requireAuthentication: true }
const projectPath = (id: string) => `/projects/${encodeURIComponent(id)}`

function toProject(project: ApiProject, members: ProjectMember[]): CollaborationProject {
  const owner = members.find((member) => member.role === 'Owner')
  return {
    ...project,
    fullDescription: project.fullDescription ?? project.description,
    goals: project.goals ?? [],
    outcomes: project.outcomes ?? [],
    ownerId: owner?.userId ?? '',
    memberIds: members.map((member) => member.userId),
    status: project.status === 'COMPLETED' ? 'Completed' : project.status === 'Recruiting' ? 'Recruiting' : 'In Progress',
  }
}

export async function listApiProjects(): Promise<CollaborationProject[]> {
  const projects: ApiProject[] = []
  let cursor: string | null | undefined
  do {
    const query = new URLSearchParams({ limit: '50' })
    if (cursor) query.set('nextCursor', cursor)
    const result = await apiRequest<Page<ApiProject>>(`/projects?${query.toString()}`, auth)
    projects.push(...result.data)
    cursor = result.pagination?.nextCursor
  } while (cursor)
  return Promise.all(projects.map(async (project) => toProject(project, await listProjectMembers(project.id))))
}
export async function getApiProject(id: string): Promise<CollaborationProject> {
  const [projectResult, members] = await Promise.all([
    apiRequest<Data<ApiProject & Pick<CollaborationProject, 'fullDescription' | 'goals' | 'outcomes'>>>(projectPath(id), auth),
    listProjectMembers(id),
  ])
  return toProject(projectResult.data, members)
}
export async function createApiProject(input: Omit<CollaborationProject, 'id' | 'ownerId' | 'memberIds' | 'createdAt'>): Promise<CollaborationProject> {
  const result = await apiRequest<Data<ApiProject & Pick<CollaborationProject, 'fullDescription' | 'goals' | 'outcomes'>>>('/projects', {
    ...auth, method: 'POST', body: JSON.stringify({ ...input, status: 'Recruiting' }),
  })
  return getApiProject(result.data.id)
}
export async function listProjectMembers(id: string) {
  const result = await apiRequest<Data<ProjectMember[]>>(`${projectPath(id)}/members`, auth)
  return result.data
}
export async function createJoinRequest(id: string, role: Exclude<ProjectRole, 'Owner'>) {
  return apiRequest<Data<JoinRequest>>(`${projectPath(id)}/join-requests`, { ...auth, method: 'POST', body: JSON.stringify({ role }) })
}
export async function listJoinRequests(id: string) {
  return apiRequest<Data<JoinRequest[]>>(`${projectPath(id)}/join-requests`, auth)
}
export async function reviewJoinRequest(projectId: string, requestId: string, action: 'approve' | 'reject') {
  return apiRequest<Data<JoinRequest>>(`${projectPath(projectId)}/join-requests/${encodeURIComponent(requestId)}`, { ...auth, method: 'PATCH', body: JSON.stringify({ action }) })
}
export async function listProjectMilestones(id: string) {
  return apiRequest<Page<ProjectMilestone>>(`${projectPath(id)}/milestones?limit=100`, auth)
}
export async function createProjectMilestone(id: string, input: { title: string; description: string; order: number; dueDate?: string }) {
  return apiRequest<Data<ProjectMilestone>>(`${projectPath(id)}/milestones`, { ...auth, method: 'POST', body: JSON.stringify(input) })
}
export async function updateProjectMilestone(id: string, milestoneId: string, updates: Partial<Pick<ProjectMilestone, 'status'>>) {
  return apiRequest<Data<ProjectMilestone>>(`${projectPath(id)}/milestones/${encodeURIComponent(milestoneId)}`, { ...auth, method: 'PATCH', body: JSON.stringify(updates) })
}
export async function listProjectTasks(id: string) {
  return apiRequest<Page<ProjectTask>>(`${projectPath(id)}/tasks?limit=100`, auth)
}
export async function createProjectTask(id: string, input: { title: string; description?: string; milestoneId?: string; assigneeId?: string; priority: 'LOW' | 'MEDIUM' | 'HIGH'; dueDate?: string }) {
  return apiRequest<Data<ProjectTask>>(`${projectPath(id)}/tasks`, { ...auth, method: 'POST', body: JSON.stringify(input) })
}
export async function updateProjectTask(id: string, taskId: string, updates: Partial<Pick<ProjectTask, 'status' | 'assigneeId'>>) {
  return apiRequest<Data<ProjectTask>>(`${projectPath(id)}/tasks/${encodeURIComponent(taskId)}`, { ...auth, method: 'PATCH', body: JSON.stringify(updates) })
}
export async function getProjectCompletion(id: string) {
  return apiRequest<Data<{ status: string; confirmations: Array<{ userId: string; status: string }>; teamSize: number; confirmedMembers?: number }>>(`${projectPath(id)}/completion`, auth)
}
export async function submitProjectCompletion(id: string) {
  return apiRequest<Data<{ status: string; confirmations?: Array<{ userId: string; status: string }>; teamSize?: number; confirmedMembers?: number }>>(`${projectPath(id)}/completion`, { ...auth, method: 'POST' })
}
export async function confirmProjectCompletion(id: string) {
  return apiRequest<Data<{ status: string; confirmedMembers: number; requiredMembers: number }>>(`${projectPath(id)}/completion/confirm`, { ...auth, method: 'POST' })
}
export async function rejectProjectCompletion(id: string, reason: string) {
  return apiRequest<Data<{ status: string; reason: string }>>(`${projectPath(id)}/completion/reject`, { ...auth, method: 'POST', body: JSON.stringify({ reason }) })
}
