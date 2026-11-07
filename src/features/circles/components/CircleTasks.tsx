import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { circleDifficulties } from '../../../data/mockData'
import { getCircleMembers } from '../../../services/circleMembership'
import { canManageCircleTasks, createCircleTask, getTaskStatus, setTaskCompleted } from '../../../services/circleTaskService'
import { useCircleTasks } from '../../../hooks/useCircleTasks'
import type { CircleDifficulty, CircleTask, LearningCircle, TaskPriority, TaskStatus } from '../../../types/dashboard'
import { Icon } from '../../../components/Icon'

interface CircleTasksProps {
  circle: LearningCircle
  onFeedback: (message: string) => void
}

const priorityStyles: Record<TaskPriority, string> = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-amber-50 text-amber-700',
  High: 'bg-rose-50 text-rose-700',
}

const statusStyles: Record<TaskStatus, string> = {
  Pending: 'bg-indigo-50 text-indigo-700',
  Completed: 'bg-emerald-50 text-emerald-700',
  Overdue: 'bg-rose-50 text-rose-700',
}

function TaskDetails({ task, assignedName, onClose }: { task: CircleTask; assignedName: string; onClose: () => void }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"><button type="button" aria-label="Close task details" onClick={onClose} className="absolute inset-0 bg-slate-950/40" /><section role="dialog" aria-modal="true" aria-labelledby="task-details-title" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Week {task.weekNumber}</p><h4 id="task-details-title" className="mt-2 text-xl font-bold text-slate-950">{task.title}</h4></div><button autoFocus type="button" aria-label="Close task details" onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><Icon name="x" /></button></div><p className="mt-4 text-sm leading-6 text-slate-600">{task.description}</p><dl className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-400">Due date</dt><dd className="mt-1 text-sm font-semibold text-slate-700">{new Date(`${task.dueDate}T00:00:00`).toLocaleDateString()}</dd></div><div className="rounded-lg bg-slate-50 p-3"><dt className="text-xs text-slate-400">Assigned member</dt><dd className="mt-1 text-sm font-semibold text-slate-700">{assignedName}</dd></div></dl><button type="button" onClick={onClose} className="mt-6 min-h-11 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Close details</button></section></div>
}

function CreateTaskForm({ circle, onCancel, onCreated }: { circle: LearningCircle; onCancel: () => void; onCreated: (message: string) => void }) {
  const members = getCircleMembers(circle)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [weekNumber, setWeekNumber] = useState(1)
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [difficulty, setDifficulty] = useState<CircleDifficulty>('Beginner')
  const [assignedMemberId, setAssignedMemberId] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const nextErrors: string[] = []
    if (!title.trim()) nextErrors.push('Add a task title.')
    if (!description.trim()) nextErrors.push('Add a task description.')
    if (!Number.isInteger(weekNumber) || weekNumber < 1) nextErrors.push('Week number must be at least 1.')
    if (!dueDate) nextErrors.push('Choose a due date.')
    setErrors(nextErrors)
    if (nextErrors.length > 0) return
    setSaving(true)
    window.setTimeout(() => {
      const result = createCircleTask(circle, { circleId: circle.id, title: title.trim(), description: description.trim(), weekNumber, dueDate, priority, difficulty, assignedMemberId: assignedMemberId || undefined })
      onCreated(result.message)
      setSaving(false)
      if (result.ok) onCancel()
    }, 350)
  }

  const inputClass = 'mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
  return <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"><button type="button" aria-label="Close create task form" onClick={onCancel} className="absolute inset-0 bg-slate-950/40" /><form onSubmit={submit} noValidate className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Owner and moderator action</p><h4 className="mt-2 text-xl font-bold text-slate-950">Create weekly task</h4></div><button type="button" aria-label="Close create task form" onClick={onCancel} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><Icon name="x" /></button></div>{errors.length > 0 && <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><ul className="list-disc space-y-1 pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}<div className="mt-5 space-y-4"><label className="block text-sm font-semibold text-slate-700">Task title<span className="ml-1 text-rose-500">*</span><input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder="e.g. Build a REST API endpoint" /></label><label className="block text-sm font-semibold text-slate-700">Description<span className="ml-1 text-rose-500">*</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} className={`${inputClass} min-h-24 resize-y`} placeholder="Describe the outcome members should work toward." /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Week number<input type="number" min={1} value={weekNumber} onChange={(event) => setWeekNumber(Number(event.target.value))} className={inputClass} /></label><label className="block text-sm font-semibold text-slate-700">Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} /></label><label className="block text-sm font-semibold text-slate-700">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} className={inputClass}><option>Low</option><option>Medium</option><option>High</option></select></label><label className="block text-sm font-semibold text-slate-700">Difficulty<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as CircleDifficulty)} className={inputClass}>{circleDifficulties.map((item) => <option key={item}>{item}</option>)}</select></label></div><label className="block text-sm font-semibold text-slate-700">Assigned member <select value={assignedMemberId} onChange={(event) => setAssignedMemberId(event.target.value)} className={inputClass}><option value="">Unassigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70">{saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}{saving ? 'Creating...' : 'Create task'}</button></div></form></div>
}

export function CircleTasks({ circle, onFeedback }: CircleTasksProps) {
  const tasks = useCircleTasks(circle.id)
  const [filter, setFilter] = useState<'All' | TaskStatus>('All')
  const [selectedTask, setSelectedTask] = useState<CircleTask | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const canManage = canManageCircleTasks(circle)
  const members = getCircleMembers(circle)
  const statusForTask = (task: CircleTask) => getTaskStatus(task)
  const filteredTasks = useMemo(() => filter === 'All' ? tasks : tasks.filter((task) => statusForTask(task) === filter), [filter, tasks])
  const completed = tasks.filter((task) => statusForTask(task) === 'Completed').length
  const overdue = tasks.filter((task) => statusForTask(task) === 'Overdue').length
  const percentage = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100)
  const memberName = (memberId?: string) => members.find((member) => member.id === memberId)?.name ?? 'Unassigned'

  return <section className="mt-6 border-t border-slate-100 pt-6" aria-labelledby="circle-tasks-title"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h3 id="circle-tasks-title" className="text-lg font-semibold text-slate-950">Weekly tasks</h3><p className="mt-1 text-sm text-slate-500">Turn your circle goals into steady, visible progress.</p></div>{canManage && <button type="button" onClick={() => setShowCreate(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><Icon name="plus" size={16} /> Create task</button>}</div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-400">Total</p><p className="mt-1 text-xl font-bold text-slate-900">{tasks.length}</p></div><div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Completed</p><p className="mt-1 text-xl font-bold text-emerald-800">{completed}</p></div><div className="rounded-lg bg-indigo-50 p-3"><p className="text-xs text-indigo-700">Pending</p><p className="mt-1 text-xl font-bold text-indigo-800">{tasks.length - completed - overdue}</p></div><div className="rounded-lg bg-rose-50 p-3"><p className="text-xs text-rose-700">Overdue</p><p className="mt-1 text-xl font-bold text-rose-800">{overdue}</p></div></div><div className="mt-4 rounded-lg border border-slate-200 p-3"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-700">Weekly progress</span><span className="text-slate-500">{percentage}% complete</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${percentage}%` }} /></div></div><div className="mt-4 flex flex-wrap gap-2">{(['All', 'Pending', 'Completed', 'Overdue'] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`min-h-10 rounded-full px-3 text-xs font-semibold ${filter === item ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item}</button>)}</div>{filteredTasks.length > 0 ? <div className="mt-4 space-y-3">{filteredTasks.map((task) => { const status = statusForTask(task); return <article key={task.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Week {task.weekNumber}</span><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusStyles[status]}`}>{status}</span><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${priorityStyles[task.priority]}`}>{task.priority} priority</span></div><h4 className="mt-2 font-semibold text-slate-950">{task.title}</h4><p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{task.description}</p></div><button type="button" onClick={() => setSelectedTask(task)} className="min-h-10 shrink-0 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">View details</button></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500"><span>Due {new Date(`${task.dueDate}T00:00:00`).toLocaleDateString()} · {task.difficulty}</span><span>Assigned to {memberName(task.assignedMemberId)}</span></div><button type="button" onClick={() => { const result = setTaskCompleted(circle, task.id, !task.completed); onFeedback(result.message) }} className={`mt-3 min-h-10 w-full rounded-lg text-sm font-semibold ${task.completed ? 'border border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>{task.completed ? 'Undo completion' : 'Mark complete'}</button></article> })}</div> : <div className="mt-4 rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center"><Icon name="check" className="mx-auto text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-700">No {filter === 'All' ? '' : filter.toLowerCase()} tasks</p><p className="mt-1 text-xs text-slate-500">Tasks will appear here when they match this filter.</p></div>}{selectedTask && <TaskDetails task={selectedTask} assignedName={memberName(selectedTask.assignedMemberId)} onClose={() => setSelectedTask(null)} />}{showCreate && <CreateTaskForm circle={circle} onCancel={() => setShowCreate(false)} onCreated={onFeedback} />}</section>
}
