import type { LearningCircle } from '../../../types/dashboard'
import { Icon } from '../../../components/Icon'

const difficultyStyles = {
  Beginner: 'bg-emerald-50 text-emerald-700',
  Intermediate: 'bg-indigo-50 text-indigo-700',
  Advanced: 'bg-violet-50 text-violet-700',
}

interface CircleCardProps {
  circle: LearningCircle
  onViewDetails: (circle: LearningCircle) => void
  isJoined: boolean
  onJoin: (circle: LearningCircle) => void
}

export function CircleCard({ circle, onViewDetails, isJoined, onJoin }: CircleCardProps) {
  return (
    <article className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex max-w-full items-center truncate rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{circle.category}</span>
          <h3 className="mt-3 truncate text-lg font-semibold text-slate-950">{circle.name}</h3>
        </div>
        {circle.featured && <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">Featured</span>}
      </div>
      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{circle.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${difficultyStyles[circle.difficulty]}`}>{circle.difficulty}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-500"><Icon name="users-round" size={14} /> {circle.members}/{circle.capacity}</span>
      </div>
      <dl className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
        <div className="flex items-start gap-2"><Icon name="target" size={16} className="mt-0.5 shrink-0 text-indigo-500" /><div className="min-w-0"><dt className="text-xs text-slate-400">Learning goal</dt><dd className="mt-0.5 truncate font-medium text-slate-700">{circle.goal}</dd></div></div>
        <div className="flex items-start gap-2"><Icon name="calendar-days" size={16} className="mt-0.5 shrink-0 text-indigo-500" /><div className="min-w-0"><dt className="text-xs text-slate-400">Weekly schedule</dt><dd className="mt-0.5 truncate font-medium text-slate-700">{circle.schedule}</dd></div></div>
        <div className="flex items-start gap-2"><Icon name="clock-3" size={16} className="mt-0.5 shrink-0 text-indigo-500" /><div className="min-w-0"><dt className="text-xs text-slate-400">Duration</dt><dd className="mt-0.5 truncate font-medium text-slate-700">{circle.duration}</dd></div></div>
        <div className="flex items-start gap-2"><Icon name="user-round" size={16} className="mt-0.5 shrink-0 text-indigo-500" /><div className="min-w-0"><dt className="text-xs text-slate-400">Created by</dt><dd className="mt-0.5 truncate font-medium text-slate-700">{circle.creator}</dd></div></div>
      </dl>
      <div className="mt-auto pt-5"><div className="mb-2 flex items-center justify-between text-xs"><span className="text-slate-400">Circle progress</span><span className="font-semibold text-slate-700">{circle.progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${circle.progress}%` }} /></div><div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => onViewDetails(circle)} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">View details <Icon name="chevron-right" size={16} /></button><button type="button" disabled={isJoined || circle.members >= circle.capacity} onClick={() => onJoin(circle)} className={`min-h-11 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${isJoined ? 'cursor-default bg-emerald-50 text-emerald-700' : circle.members >= circle.capacity ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{isJoined ? 'Joined' : circle.members >= circle.capacity ? 'Full' : 'Join circle'}</button></div></div>
    </article>
  )
}
