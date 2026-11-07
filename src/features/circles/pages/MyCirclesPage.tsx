import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../../components/Icon'
import { useCircleMemberships } from '../../../hooks/useCircleMemberships'
import { useLearningCircles } from '../../../hooks/useLearningCircles'
import { getCircleMemberCount } from '../../../services/circleMembership'
import type { LearningCircle } from '../../../types/dashboard'

function MyCircleCard({ circle, onLeave }: { circle: LearningCircle; onLeave: (circle: LearningCircle) => void }) {
  return <article className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="inline-flex max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{circle.category}</span><h2 className="mt-3 truncate text-lg font-semibold text-slate-950">{circle.name}</h2></div><span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Joined</span></div>
    <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{circle.description}</p>
    <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{circle.difficulty}</span><span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-500"><Icon name="users-round" size={14} /> {circle.members}/{circle.capacity}</span></div>
    <div className="mt-5 border-t border-slate-100 pt-4"><p className="text-xs text-slate-400">Progress placeholder</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${circle.progress}%` }} /></div><p className="mt-1 text-xs text-slate-500">{circle.progress}% complete</p></div>
    <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2"><Link to={`/circles?circle=${encodeURIComponent(circle.id)}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">View circle <Icon name="chevron-right" size={16} /></Link><button type="button" onClick={() => onLeave(circle)} className="min-h-11 rounded-lg border border-rose-200 px-3 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50">Leave circle</button></div>
  </article>
}

function LeaveConfirmation({ circle, onCancel, onConfirm }: { circle: LearningCircle; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button type="button" aria-label="Cancel leaving circle" onClick={onCancel} className="absolute inset-0 bg-slate-950/40" /><section role="alertdialog" aria-modal="true" aria-labelledby="my-leave-circle-title" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="my-leave-circle-title" className="text-xl font-bold text-slate-950">Leave {circle.name}?</h2><p className="mt-2 text-sm leading-6 text-slate-500">You can join again later if a spot is available.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Keep membership</button><button type="button" onClick={onConfirm} className="min-h-11 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">Leave circle</button></div></section></div>
}

export function MyCirclesPage() {
  const circles = useLearningCircles()
  const { memberships, leave } = useCircleMemberships()
  const [leaveTarget, setLeaveTarget] = useState<LearningCircle | null>(null)
  const [feedback, setFeedback] = useState('')
  const joinedIds = new Set(memberships.map((membership) => membership.circleId))
  const joinedCircles = circles.filter((circle) => joinedIds.has(circle.id)).map((circle) => ({ ...circle, members: getCircleMemberCount(circle, memberships) }))

  const confirmLeave = () => {
    if (!leaveTarget) return
    const result = leave(leaveTarget)
    setFeedback(result.message)
    setLeaveTarget(null)
  }

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8"><div><Link to="/circles" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"><Icon name="chevron-right" size={16} className="rotate-180" /> Explore circles</Link><p className="mb-2 mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-indigo-600">Your communities</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">My Learning Circles</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Keep track of the circles you have joined in this browser.</p></div><Link to="/circles" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"><Icon name="users-round" size={17} /> Discover circles</Link></header>
    <p className="rounded-lg bg-slate-100 p-3 text-xs leading-5 text-slate-500">Local demo memberships only: your joined circles are stored in this browser and are not synchronized across users or devices.</p>
    {feedback && <div role="status" aria-live="polite" className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><span>{feedback}</span><button type="button" onClick={() => setFeedback('')} aria-label="Dismiss notification" className="flex min-h-8 min-w-8 items-center justify-center rounded-md hover:bg-emerald-100"><Icon name="x" size={16} /></button></div>}
    {joinedCircles.length > 0 ? <section><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">Joined circles</h2><p className="mt-1 text-sm text-slate-500">Your current learning communities.</p></div><span className="text-sm text-slate-400">{joinedCircles.length} {joinedCircles.length === 1 ? 'circle' : 'circles'}</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{joinedCircles.map((circle) => <MyCircleCard key={circle.id} circle={circle} onLeave={setLeaveTarget} />)}</div></section> : <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-indigo-600"><Icon name="users-round" /></div><h2 className="mt-4 text-lg font-semibold text-slate-950">No joined circles yet</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Explore the discovery page and join a circle that matches your goals.</p><Link to="/circles" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Explore circles</Link></section>}
    {leaveTarget && <LeaveConfirmation circle={leaveTarget} onCancel={() => setLeaveTarget(null)} onConfirm={confirmLeave} />}
  </div>
}
