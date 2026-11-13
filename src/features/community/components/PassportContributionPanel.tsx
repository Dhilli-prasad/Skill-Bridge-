import { useEffect, useState } from 'react'
import { apiRequest } from '../../../services/apiClient'

type Contribution = {
  contributionId: string
  projectId: string
  projectTitle?: string
  projectDescription?: string
  role?: string
  completedTaskCount?: number
  completionTimestamp?: string
  verifiedCompletion?: boolean
}

type CompletedProject = {
  projectId: string
  title?: string
  description?: string
  role?: string
  completedAt?: string
  completedTaskCount?: number
  verifiedContribution?: boolean
  repositoryUrl?: string
}

type ContributionResponse = { data: Contribution[] }
type CompletedProjectResponse = { data: CompletedProject[] }

const apiMode = import.meta.env.VITE_DEVELOPER_PASSPORT_MODE === 'api'

function formatDate(value?: string) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString()
}

export function PassportContributionPanel({ userId, isCurrentUser = false }: { userId: string; isCurrentUser?: boolean }) {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [projects, setProjects] = useState<CompletedProject[]>([])
  const [loading, setLoading] = useState(apiMode)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!apiMode) return
    let active = true
    const pathId = encodeURIComponent(userId)
    const prefix = isCurrentUser ? '/users/me' : `/users/${pathId}`
    Promise.all([
      apiRequest<ContributionResponse>(`${prefix}/contributions`, { requireAuthentication: true }),
      apiRequest<CompletedProjectResponse>(`${prefix}/completed-projects`, { requireAuthentication: true }),
    ]).then(([contributionResponse, projectResponse]) => {
      if (!active) return
      setContributions(contributionResponse.data ?? [])
      setProjects(projectResponse.data ?? [])
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load verified contributions.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [userId, isCurrentUser])

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="verified-contributions-heading">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Backend passport records</p>
        <h2 id="verified-contributions-heading" className="mt-1 text-xl font-bold text-slate-950">Verified project contributions</h2>
      </div>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{apiMode ? 'API mode' : 'Demo mode'}</span>
    </div>
    {!apiMode && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Demo mode is selected. Local passport activity remains available above; verified backend contributions are not fabricated here.</p>}
    {loading && <p className="mt-4 text-sm text-slate-500" role="status">Loading verified contributions…</p>}
    {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}
    {apiMode && !loading && !error && <>
      {projects.length > 0 ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{projects.map((project) => <article key={project.projectId} className="rounded-xl border border-slate-100 p-4">
        <h3 className="font-semibold text-slate-900">{project.title ?? 'Completed project'}</h3>
        <p className="mt-1 text-sm text-slate-600">{project.description ?? 'No public description.'}</p>
        <p className="mt-3 text-xs text-slate-500">{project.role ?? 'Contributor'} · completed {formatDate(project.completedAt)} · {project.completedTaskCount ?? 0} completed tasks</p>
        {project.repositoryUrl && <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-indigo-700">View public project →</a>}
      </article>)}</div> : <p className="mt-4 text-sm text-slate-500">No verified completed projects are recorded for this developer.</p>}
      {contributions.length > 0 && <p className="mt-4 text-xs text-slate-500">{contributions.length} application-verified contribution record{contributions.length === 1 ? '' : 's'} loaded. These are not external certifications.</p>}
    </>}
    <p className="mt-4 text-xs text-slate-400">Self-reported skills and learning achievements are shown separately from application-verified project contributions.</p>
  </section>
}
