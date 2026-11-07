import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getProject, createProject, updateProject, type ProjectInput } from '../../../services/projectService'
import type { LearningDifficulty, ProjectStatus } from '../../../types/dashboard'

const split = (value: string) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean)

export function ProjectFormPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const existing = projectId ? getProject(projectId) : undefined
  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [fullDescription, setFullDescription] = useState(existing?.fullDescription ?? '')
  const [category, setCategory] = useState(existing?.category ?? 'Web Development')
  const [difficulty, setDifficulty] = useState<LearningDifficulty>(existing?.difficulty ?? 'Beginner')
  const [technology, setTechnology] = useState(existing?.technology.join(', ') ?? '')
  const [goals, setGoals] = useState(existing?.goals.join('\n') ?? '')
  const [outcomes, setOutcomes] = useState(existing?.outcomes.join('\n') ?? '')
  const [requiredRoles, setRequiredRoles] = useState(existing?.requiredRoles.join(', ') ?? '')
  const [capacity, setCapacity] = useState(String(existing?.capacity ?? 4))
  const [repositoryUrl, setRepositoryUrl] = useState(existing?.repositoryUrl ?? '')
  const [status, setStatus] = useState<ProjectStatus>(existing?.status ?? 'Recruiting')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const input: ProjectInput = { title, description, fullDescription, category, difficulty, technology: split(technology), goals: split(goals), outcomes: split(outcomes), requiredRoles: split(requiredRoles), capacity: Number(capacity), repositoryUrl: repositoryUrl.trim() || undefined, status }
    const result = projectId ? updateProject(projectId, input) : createProject(input)
    setFeedback(result.message)
    setSubmitting(false)
    if (result.ok) navigate(`/projects/${result.project.id}`)
  }
  if (projectId && !existing) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-xl font-bold">Project not found</h1><Link to="/projects" className="mt-3 inline-block font-semibold text-indigo-700">Browse projects</Link></div>
  const field = (label: string, value: string, setValue: (value: string) => void, required = false, multiline = false) => <label className="block text-sm font-medium text-slate-700">{label}{required && <span className="text-rose-600"> *</span>}{multiline ? <textarea required={required} value={value} onChange={(event) => setValue(event.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /> : <input required={required} value={value} onChange={(event) => setValue(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />}</label>
  return <div className="mx-auto max-w-3xl space-y-6"><Link to="/projects" className="text-sm font-semibold text-indigo-700">← All projects</Link><header><p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-600">Collaboration</p><h1 className="mt-1 text-3xl font-bold text-slate-950">{projectId ? 'Edit Project' : 'Create Project'}</h1><p className="mt-2 text-sm text-slate-600">Projects are stored locally for this demo workspace.</p></header><form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><div className="grid gap-5 md:grid-cols-2">{field('Project title', title, setTitle, true)}{field('Short description', description, setDescription, true)}{field('Project category', category, setCategory, true)}<label className="block text-sm font-medium text-slate-700">Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as LearningDifficulty)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label></div>{field('Full project description', fullDescription, setFullDescription, true, true)}<div className="grid gap-5 md:grid-cols-2">{field('Technology stack (comma separated)', technology, setTechnology, true)}{field('Required team roles (comma separated)', requiredRoles, setRequiredRoles, true)}{field('Goals (one per line)', goals, setGoals, true, true)}{field('Expected outcomes (one per line)', outcomes, setOutcomes, true, true)}</div><div className="grid gap-5 md:grid-cols-3"><label className="block text-sm font-medium text-slate-700">Maximum team size<input type="number" min="1" max="50" required value={capacity} onChange={(event) => setCapacity(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3" /></label><label className="block text-sm font-medium text-slate-700">Project status<select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3"><option>Recruiting</option><option>In Progress</option><option>Completed</option></select></label>{field('Repository URL', repositoryUrl, setRepositoryUrl)}</div>{feedback && <p role="alert" className="text-sm text-rose-600">{feedback}</p>}<div className="flex flex-wrap gap-3"><button disabled={submitting} type="submit" className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{submitting ? 'Saving...' : projectId ? 'Save changes' : 'Create project'}</button><Link to={projectId ? `/projects/${projectId}` : '/projects'} className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</Link></div></form></div>
}
