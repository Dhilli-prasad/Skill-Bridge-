import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createApiProject } from '../../../../services/projectApi'
import type { LearningDifficulty } from '../../../../types/dashboard'

const split = (value: string) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean)

export function ApiProjectFormPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fullDescription, setFullDescription] = useState('')
  const [category, setCategory] = useState('Web Development')
  const [difficulty, setDifficulty] = useState<LearningDifficulty>('Beginner')
  const [technology, setTechnology] = useState('')
  const [goals, setGoals] = useState('')
  const [outcomes, setOutcomes] = useState('')
  const [requiredRoles, setRequiredRoles] = useState('')
  const [capacity, setCapacity] = useState('4')
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true)
    try {
      const project = await createApiProject({ title, description, fullDescription, category, difficulty, technology: split(technology), goals: split(goals), outcomes: split(outcomes), requiredRoles: split(requiredRoles), capacity: Number(capacity), repositoryUrl: repositoryUrl.trim() || undefined, status: 'Recruiting' })
      navigate(`/projects/${project.id}`)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to create project.') }
    finally { setBusy(false) }
  }
  if (projectId) return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-bold text-amber-950">Project editing is not supported by the backend.</h1><p className="mt-2 text-sm text-amber-800">The available project API does not expose an update route.</p><Link to={`/projects/${projectId}`} className="mt-4 inline-block font-semibold text-indigo-700">Return to project</Link></div>
  const field = (label: string, value: string, setValue: (value: string) => void, required = false, multiline = false) => <label className="block text-sm font-medium text-slate-700">{label}{required && <span className="text-rose-600"> *</span>}{multiline ? <textarea required={required} value={value} onChange={(event) => setValue(event.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /> : <input required={required} value={value} onChange={(event) => setValue(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3" />}</label>
  return <div className="mx-auto max-w-3xl space-y-6"><Link to="/projects" className="text-sm font-semibold text-indigo-700">← All projects</Link><header><p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-600">Collaboration</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Create Project</h1><p className="mt-2 text-sm text-slate-600">The backend creates projects in Recruiting status.</p></header><form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><div className="grid gap-5 md:grid-cols-2">{field('Project title', title, setTitle, true)}{field('Short description', description, setDescription, true)}{field('Project category', category, setCategory, true)}<label className="block text-sm font-medium text-slate-700">Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as LearningDifficulty)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label></div>{field('Full project description', fullDescription, setFullDescription, true, true)}<div className="grid gap-5 md:grid-cols-2">{field('Technology stack (comma separated)', technology, setTechnology, true)}{field('Required team roles (comma separated)', requiredRoles, setRequiredRoles, true)}{field('Goals (one per line)', goals, setGoals, true, true)}{field('Expected outcomes (one per line)', outcomes, setOutcomes, true, true)}</div><div className="grid gap-5 md:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Maximum team size<input type="number" min="1" max="50" required value={capacity} onChange={(event) => setCapacity(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-200 px-3" /></label>{field('Repository URL', repositoryUrl, setRepositoryUrl)}</div>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}<div className="flex flex-wrap gap-3"><button disabled={busy} type="submit" className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Creating…' : 'Create project'}</button><Link to="/projects" className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</Link></div></form></div>
}
