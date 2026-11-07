import { useState } from 'react'
import { Icon } from './Icon'
import { useAuth } from '../auth/useAuth'
import { useNavigate } from 'react-router-dom'

interface TopbarProps {
  mobileNavOpen: boolean
  onMenuClick: () => void
}

export function Topbar({ mobileNavOpen, onMenuClick }: TopbarProps) {
  const auth = useAuth()
  const navigate = useNavigate()
  const [searchOpen, setSearchOpen] = useState(false)
  return <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
    <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 lg:hidden"><button type="button" aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileNavOpen} onClick={onMenuClick} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><Icon name="menu" /></button><div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 font-bold text-white">S</div><span className="font-bold text-slate-950">SkillBridge</span></div>
      <div className="hidden text-sm text-slate-500 lg:block">Thursday, November 7 <span className="mx-2 text-slate-300">/</span> Keep building</div>
      <div className="flex items-center gap-2 sm:gap-4">
        {searchOpen && <input autoFocus aria-label="Search SkillBridge" placeholder="Search SkillBridge..." className="w-40 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2 sm:w-56" />}
        <button type="button" aria-label="Search" onClick={() => setSearchOpen((open) => !open)} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Icon name="search" /></button>
        <div className="h-8 w-px bg-slate-200" />
        {auth.status === 'authenticated' ? <button type="button" onClick={() => { void auth.signOut() }} className="flex min-h-11 items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50" aria-label="Sign out"><div className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">{(auth.user?.username ?? 'U').slice(0, 2).toUpperCase()}</div><span className="hidden text-sm font-medium text-slate-700 sm:block">Sign out</span></button> : <button type="button" onClick={() => navigate('/sign-in')} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Sign in</button>}
      </div>
    </div>
  </header>
}
