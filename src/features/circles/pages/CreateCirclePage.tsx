import { Link } from 'react-router-dom'
import { Icon } from '../../../components/Icon'
import { CreateCircleForm } from '../components/CreateCircleForm'

export function CreateCirclePage() {
  return <div className="mx-auto max-w-4xl space-y-6">
    <div><Link to="/circles" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"><Icon name="chevron-right" size={16} className="rotate-180" /> Back to learning circles</Link><p className="mb-2 mt-5 text-sm font-semibold uppercase tracking-[0.14em] text-indigo-600">Build your community</p><h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Create Your Learning Circle</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Bring developers together and achieve something great.</p></div>
    <CreateCircleForm />
  </div>
}
