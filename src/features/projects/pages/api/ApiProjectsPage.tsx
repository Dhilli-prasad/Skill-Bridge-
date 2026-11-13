import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../../../components/Icon'
import { ApiClientError } from '../../../../services/apiClient'
import { listApiProjects } from '../../../../services/projectApi'
import { getCurrentCognitoUser } from '../../../../auth/cognito'
import { runWithLoading } from '../../../../services/asyncState'
import type { CollaborationProject } from '../../../../types/dashboard'

export function ApiProjectsPage() {
  const [projects, setProjects] = useState<CollaborationProject[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [technology, setTechnology] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    let active = true
    runWithLoading(setLoading, () => Promise.all([listApiProjects(), getCurrentCognitoUser()])).then(([items, user]) => { if (active) { setProjects(items); setCurrentUserId(user?.userId ?? '') } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof ApiClientError && cause.status === 401 ? 'Sign in again to load projects.' : cause instanceof Error ? cause.message : 'Unable to load projects.') })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => projects.filter((project) => {
    const text = `${project.title} ${project.description}`.toLowerCase()
    return (!query.trim() || text.includes(query.trim().toLowerCase())) && (!technology || project.technology.includes(technology))
      && (!category || project.category === category) && (!difficulty || project.difficulty === difficulty) && (!status || project.status === status)
  }), [projects, query, technology, category, difficulty, status])
  const myProjects = projects.filter((project) => project.memberIds.includes(currentUserId))

  return <div className="space-y-6">
    <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5"><h2 className="text-xl font-bold text-slate-950">My Projects</h2><p className="mt-1 text-sm text-slate-500">Projects you own or have joined.</p>{myProjects.length ? <div className="mt-4 flex flex-wrap gap-2">{myProjects.map((project) => <Link key={project.id} to={`/projects/${project.id}`} className="rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm font-semibold text-indigo-700">{project.title}</Link>)}</div> : <p className="mt-3 text-sm text-slate-500">You are not part of any listed projects yet.</p>}</section>
    <header className="flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-600">Collaboration</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Project Collaboration</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Browse projects persisted by the SkillBridge API.</p></div><Link to="/projects/create" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Create project</Link></header>
    <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-5"><input aria-label="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects..." className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm" /><select aria-label="Filter by technology" value={technology} onChange={(event) => setTechnology(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm"><option value="">All technologies</option>{[...new Set(projects.flatMap((project) => project.technology))].sort().map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm"><option value="">All categories</option>{[...new Set(projects.map((project) => project.category))].sort().map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter by difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm"><option value="">All difficulties</option>{['Beginner', 'Intermediate', 'Advanced'].map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filter by project status" value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm"><option value="">All statuses</option>{['Recruiting', 'In Progress', 'Completed'].map((item) => <option key={item}>{item}</option>)}</select></section>
    {loading ? <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading projects…</p> : error ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</p> : filtered.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-600">No projects match your filters.</p> : <div className="grid gap-4 md:grid-cols-2">{filtered.map((project) => <article key={project.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{project.status}</span><span className="text-xs text-slate-500">{project.difficulty}</span></div><h2 className="mt-4 text-xl font-bold text-slate-950">{project.title}</h2><p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{project.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{project.technology.map((item) => <span key={item} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{item}</span>)}</div><p className="mt-3 text-xs text-slate-500">{project.category} · {project.memberIds.length}/{project.capacity} members</p><Link to={`/projects/${project.id}`} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white">View project <Icon name="chevron-right" size={15} /></Link></article>)}</div>}
  </div>
}
