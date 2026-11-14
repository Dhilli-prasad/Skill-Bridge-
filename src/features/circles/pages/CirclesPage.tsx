import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleCard } from '../components/CircleCard'
import { CircleFilters } from '../components/CircleFilters'
import { CircleMembers } from '../components/CircleMembers'
import { CircleTasks } from '../components/CircleTasks'
import { CircleDiscussions } from '../components/CircleDiscussions'
import { CircleProgress } from '../components/CircleProgress'
import { useLearningCircles } from '../../../hooks/useLearningCircles'
import { useCircleMemberships } from '../../../hooks/useCircleMemberships'
import { getCircleMemberCount, isMember } from '../../../services/circleMembership'
import type { LearningCircle } from '../../../types/dashboard'
import { Icon } from '../../../components/Icon'
import { ProfileSummaryCard } from '../../profile/components/ProfileSummaryCard'

function CircleDetails({ circle, onClose, isJoined, onJoin, onLeave, onFeedback }: { circle: LearningCircle; onClose: () => void; isJoined: boolean; onJoin: (circle: LearningCircle) => void; onLeave: (circle: LearningCircle) => void; onFeedback: (message: string) => void }) {
  const isFull = circle.members >= circle.capacity
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button type="button" aria-label="Close circle details" onClick={onClose} className="absolute inset-0 bg-slate-950/40" /><section role="dialog" aria-modal="true" aria-labelledby="circle-details-title" className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">{circle.category}</p><h2 id="circle-details-title" className="mt-2 text-2xl font-bold text-slate-950">{circle.name}</h2></div><button autoFocus type="button" aria-label="Close circle details" onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Icon name="x" /></button></div><p className="mt-4 text-sm leading-6 text-slate-500">{circle.description}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-400">Learning goal</p><p className="mt-1 text-sm font-semibold text-slate-700">{circle.goal}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-400">Weekly schedule</p><p className="mt-1 text-sm font-semibold text-slate-700">{circle.schedule}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-400">Difficulty</p><p className="mt-1 text-sm font-semibold text-slate-700">{circle.difficulty}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-400">Members</p><p className="mt-1 text-sm font-semibold text-slate-700">{getCircleMemberCount(circle)} of {circle.capacity} spots filled</p></div></div><p className="mt-5 text-sm text-slate-500">Created by <span className="font-semibold text-slate-700">{circle.creator}</span></p>    <CircleMembers circle={circle} canManage={circle.creator === 'Aarav Kumar'} onFeedback={onFeedback} /><CircleTasks circle={circle} onFeedback={onFeedback} /><CircleDiscussions circle={circle} onFeedback={onFeedback} /><CircleProgress circle={circle} /><div className="mt-6 grid gap-2 sm:grid-cols-2"><button type="button" disabled={isJoined || isFull} onClick={() => onJoin(circle)} className={`min-h-11 rounded-lg px-4 py-2.5 text-sm font-semibold ${isJoined ? 'cursor-default bg-emerald-50 text-emerald-700' : isFull ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{isJoined ? 'Joined' : isFull ? 'Circle full' : 'Join circle'}</button>{isJoined && <button type="button" onClick={() => onLeave(circle)} className="min-h-11 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50">Leave circle</button>}</div><button type="button" onClick={onClose} className="mt-3 min-h-11 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close details</button></section></div>
}

function LeaveConfirmation({ circle, onCancel, onConfirm }: { circle: LearningCircle; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"><button type="button" aria-label="Cancel leaving circle" onClick={onCancel} className="absolute inset-0 bg-slate-950/40" /><section role="alertdialog" aria-modal="true" aria-labelledby="leave-circle-title" className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="leave-circle-title" className="text-xl font-bold text-slate-950">Leave {circle.name}?</h2><p className="mt-2 text-sm leading-6 text-slate-500">You will be removed from your local demo membership. You can join again later if a spot is available.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Keep membership</button><button type="button" onClick={onConfirm} className="min-h-11 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">Leave circle</button></div></section></div>
}

export function CirclesPage() {
  const circles = useLearningCircles()
  const { memberships, join, leave } = useCircleMemberships()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [sort, setSort] = useState('popular')
  const [selectedCircle, setSelectedCircle] = useState<LearningCircle | null>(() => {
    const circleId = new URLSearchParams(window.location.search).get('circle')
    return circles.find((circle) => circle.id === circleId) ?? null
  })
  const [leaveTarget, setLeaveTarget] = useState<LearningCircle | null>(null)
  const [feedback, setFeedback] = useState('')
  const filteredCircles = useMemo(() => {
    const query = search.toLowerCase().trim()
    return [...circles]
      .filter((circle) => (!query || `${circle.name} ${circle.description}`.toLowerCase().includes(query)) && (!category || circle.category === category) && (!difficulty || circle.difficulty === difficulty))
      .map((circle) => ({ ...circle, members: getCircleMemberCount(circle, memberships) }))
      .sort((first, second) => sort === 'newest' ? second.createdAt.localeCompare(first.createdAt) : second.members - first.members)
  }, [category, difficulty, search, sort, circles, memberships])
  const featuredCircles = filteredCircles.filter((circle) => circle.featured)
  const availableCircles = filteredCircles.filter((circle) => !circle.featured)
  const hasFilters = Boolean(search || category || difficulty || sort !== 'popular')
  const clearFilters = () => { setSearch(''); setCategory(''); setDifficulty(''); setSort('popular') }
  const handleJoin = (circle: LearningCircle) => {
    const result = join(circle)
    setFeedback(result.message)
    if (result.ok) {
      setSelectedCircle((current) => current ? { ...current, members: current.members + 1 } : current)
    }
  }
  const handleCloseDetails = () => {
    setSelectedCircle(null)
    if (searchParams.has('circle')) setSearchParams({})
  }
  const handleLeave = () => {
    if (!leaveTarget) return
    const result = leave(leaveTarget)
    setFeedback(result.message)
    setLeaveTarget(null)
    handleCloseDetails()
  }

  return <div className="space-y-6"><ProfileSummaryCard self />
    <header className="flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-indigo-600">Find your people</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Learning Circles</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Find your people. Share your goals. Grow together.</p></div><div className="flex flex-col gap-2 sm:flex-row"><Link to="/circles/my-circles" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"><Icon name="users-round" size={17} /> My circles</Link><Link to="/circles/create" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"><Icon name="plus" size={17} /> Create circle</Link></div></header>
    {feedback && <div role="status" aria-live="polite" className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><span>{feedback}</span><button type="button" onClick={() => setFeedback('')} aria-label="Dismiss notification" className="flex min-h-8 min-w-8 items-center justify-center rounded-md hover:bg-emerald-100"><Icon name="x" size={16} /></button></div>}
    <CircleFilters search={search} category={category} difficulty={difficulty} sort={sort} onSearchChange={setSearch} onCategoryChange={setCategory} onDifficultyChange={setDifficulty} onSortChange={setSort} onClear={clearFilters} hasFilters={hasFilters} />
    {filteredCircles.length > 0 ? <><section><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">Featured circles</h2><p className="mt-1 text-sm text-slate-500">Start with a community that matches your goals.</p></div><span className="text-sm text-slate-400">{featuredCircles.length} circles</span></div>{featuredCircles.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{featuredCircles.map((circle) => <CircleCard key={circle.id} circle={circle} isJoined={isMember(circle.id, memberships)} onJoin={handleJoin} onViewDetails={setSelectedCircle} />)}</div> : <p className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">No featured circles match these filters.</p>}</section><section><div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">All available circles</h2><p className="mt-1 text-sm text-slate-500">Explore every active learning community.</p></div><span className="text-sm text-slate-400">{availableCircles.length} circles</span></div>{availableCircles.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{availableCircles.map((circle) => <CircleCard key={circle.id} circle={circle} isJoined={isMember(circle.id, memberships)} onJoin={handleJoin} onViewDetails={setSelectedCircle} />)}</div> : <p className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">All matching circles are featured above.</p>}</section></> : <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-indigo-50 text-indigo-600"><Icon name="search" /></div><h2 className="mt-4 text-lg font-semibold text-slate-950">No circles found</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Try another search term or clear your filters to discover more learning communities.</p><button type="button" onClick={clearFilters} className="mt-5 min-h-11 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Clear filters</button></section>}
    {selectedCircle && <CircleDetails circle={selectedCircle} isJoined={isMember(selectedCircle.id, memberships)} onJoin={handleJoin} onLeave={setLeaveTarget} onFeedback={setFeedback} onClose={handleCloseDetails} />}
    {leaveTarget && <LeaveConfirmation circle={leaveTarget} onCancel={() => setLeaveTarget(null)} onConfirm={handleLeave} />}
  </div>
}
