import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError, apiRequest } from './apiClient'
import { createApiProject, createJoinRequest, listApiProjects, reviewJoinRequest } from './projectApi'
import { runWithLoading } from './asyncState'

vi.mock('./apiClient', () => ({
  ApiClientError: class ApiClientError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status } },
  apiRequest: vi.fn(),
}))

const apiMock = vi.mocked(apiRequest)
beforeEach(() => apiMock.mockReset())

describe('project collaboration API integration', () => {
  it('creates a project without trusting or submitting a frontend owner identity', async () => {
    apiMock.mockImplementation(async (path) => {
      if (path === '/projects') return { data: { id: 'created-1' } }
      if (path === '/projects/created-1') return { data: { id: 'created-1', title: 'Created', description: 'Description', fullDescription: 'Details', goals: ['Ship'], outcomes: ['Demo'], technology: ['AWS'], category: 'Cloud', difficulty: 'Beginner', requiredRoles: ['Developer'], capacity: 3, memberCount: 1, status: 'Recruiting', createdAt: '2026-01-01' } }
      if (path === '/projects/created-1/members') return { data: [{ projectId: 'created-1', userId: 'authenticated-owner', role: 'Owner', joinedAt: '2026-01-01' }] }
      return { data: [] }
    })
    const created = await createApiProject({ title: 'Created', description: 'Description', fullDescription: 'Details', goals: ['Ship'], outcomes: ['Demo'], technology: ['AWS'], category: 'Cloud', difficulty: 'Beginner', requiredRoles: ['Developer'], capacity: 3, status: 'Completed' })
    expect(created.ownerId).toBe('authenticated-owner')
    expect(apiMock).toHaveBeenCalledWith('/projects', expect.objectContaining({ method: 'POST', requireAuthentication: true }))
    const body = JSON.parse(String(apiMock.mock.calls[0]?.[1]?.body))
    expect(body.status).toBe('Recruiting')
    expect(body).not.toHaveProperty('ownerId')
  })

  it('loads projects and derives owner/team from the members route', async () => {
    apiMock.mockImplementation(async (path) => {
      if (path === '/projects?limit=50') return { data: [{ id: 'p-1', title: 'API project', description: 'Shared', technology: ['AWS'], category: 'Cloud', difficulty: 'Beginner', requiredRoles: ['Developer'], capacity: 3, memberCount: 2, status: 'Recruiting', createdAt: '2026-01-01' }], pagination: { limit: 50 } }
      if (path === '/projects/p-1/members') return { data: [{ projectId: 'p-1', userId: 'owner-sub', role: 'Owner', joinedAt: '2026-01-01' }, { projectId: 'p-1', userId: 'member-sub', role: 'Developer', joinedAt: '2026-01-02' }] }
      return { data: [] }
    })
    await expect(listApiProjects()).resolves.toMatchObject([{ id: 'p-1', ownerId: 'owner-sub', memberIds: ['owner-sub', 'member-sub'], status: 'Recruiting' }])
    expect(apiMock).toHaveBeenCalledWith('/projects?limit=50', { requireAuthentication: true })
    expect(apiMock).toHaveBeenCalledWith('/projects/p-1/members', { requireAuthentication: true })
  })

  it('submits join requests and reviews through the backend-supported routes', async () => {
    apiMock.mockResolvedValue({ data: { id: 'join-1', projectId: 'p-1', status: 'pending' } })
    await createJoinRequest('p-1', 'Designer')
    expect(apiMock).toHaveBeenCalledWith('/projects/p-1/join-requests', { requireAuthentication: true, method: 'POST', body: JSON.stringify({ role: 'Designer' }) })
    await reviewJoinRequest('p-1', 'join-1', 'approve')
    expect(apiMock).toHaveBeenLastCalledWith('/projects/p-1/join-requests/join-1', { requireAuthentication: true, method: 'PATCH', body: JSON.stringify({ action: 'approve' }) })
    await reviewJoinRequest('p-1', 'join-1', 'reject')
    expect(apiMock).toHaveBeenLastCalledWith('/projects/p-1/join-requests/join-1', { requireAuthentication: true, method: 'PATCH', body: JSON.stringify({ action: 'reject' }) })
  })

  it('surfaces API failures and authorization errors without a local fallback', async () => {
    apiMock.mockRejectedValueOnce(new ApiClientError(503, 'API unavailable'))
    await expect(createJoinRequest('p-1', 'Developer')).rejects.toMatchObject({ status: 503, message: 'API unavailable' })
    apiMock.mockRejectedValueOnce(new ApiClientError(401, 'Authentication is required.'))
    await expect(createJoinRequest('p-1', 'Developer')).rejects.toMatchObject({ status: 401 })
    apiMock.mockRejectedValueOnce(new ApiClientError(403, 'Forbidden'))
    await expect(reviewJoinRequest('p-1', 'join-1', 'reject')).rejects.toMatchObject({ status: 403 })
  })

  it('keeps the loading state active until an API operation settles', async () => {
    let resolveOperation!: (value: string) => void
    const operation = new Promise<string>((resolve) => { resolveOperation = resolve })
    const states: boolean[] = []
    const pending = runWithLoading((value) => states.push(value), () => operation)
    expect(states).toEqual([true])
    resolveOperation('done')
    await expect(pending).resolves.toBe('done')
    expect(states).toEqual([true, false])
  })
})
