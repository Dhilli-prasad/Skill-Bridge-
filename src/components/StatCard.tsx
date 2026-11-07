import type { Stat } from '../types/dashboard'
import { Icon } from './Icon'

const tones = { indigo: 'bg-indigo-50 text-indigo-600', violet: 'bg-violet-50 text-violet-600', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600' }
export function StatCard({ stat }: { stat: Stat }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100"><div className="flex items-start justify-between"><div className={`grid h-10 w-10 place-items-center rounded-lg ${tones[stat.tone]}`}><Icon name={stat.icon} /></div><span className="text-xs font-medium text-emerald-600">↗ {stat.change.split(' ')[0]}</span></div><p className="mt-4 text-2xl font-bold tracking-tight text-slate-950">{stat.value}</p><p className="mt-1 text-sm text-slate-500">{stat.label}</p><p className="mt-3 text-xs text-slate-400">{stat.change}</p></div>
}
