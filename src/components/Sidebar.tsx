import { NavLink } from 'react-router-dom'
import { navItems } from '../data/mockData'
import { Icon } from './Icon'
import { COMMUNITY_USER_ID } from '../services/communityService'
import { getDeveloperProfile } from '../services/developerProfileService'

interface SidebarProps {
  mobileNavOpen: boolean
  onClose: () => void
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ mobileNavOpen, onClose, collapsed, onToggle }: SidebarProps) {
  const compact = collapsed && !mobileNavOpen
  const profile = getDeveloperProfile(COMMUNITY_USER_ID)
  const initials = profile?.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2) ?? 'AK'
  const navigation = (
    <nav aria-label="Primary navigation" className="space-y-1">
      {navItems.map((item) => <NavLink key={item.path} end={item.path === '/'} to={item.path} onClick={onClose} title={compact ? item.label : undefined} className={({ isActive }) => `group flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${compact ? 'justify-center' : 'gap-3'} ${isActive ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}><Icon name={item.icon} size={18} /><span className={compact ? 'sr-only' : ''}>{item.label}</span></NavLink>)}
    </nav>
  )

  const content = (
    <>
      <div className={`flex items-center ${compact ? 'justify-center' : 'gap-3'} px-3`}>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm shadow-indigo-200">S</div>
        <div className={compact ? 'sr-only' : ''}><p className="font-bold tracking-tight text-slate-950">SkillBridge</p><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Grow together</p></div>
      </div>
      <div className={`mb-3 mt-8 flex items-center ${compact ? 'justify-center' : 'justify-between px-3'}`}><p className={compact ? 'sr-only' : 'text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400'}>Workspace</p><button type="button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={onToggle} className="hidden min-h-9 min-w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 lg:flex"><Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={16} /></button></div>
      {navigation}
    </>
  )

  return (
    <>
    <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white lg:block ${compact ? 'w-20' : 'w-64'}`}>
      <div className="flex h-full flex-col px-4 py-5">
        {content}
        <NavLink to={`/passport/${COMMUNITY_USER_ID}`} onClick={onClose} title={compact ? profile?.fullName : undefined} className={`mt-auto flex items-center rounded-xl border border-slate-200 bg-slate-50 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${compact ? 'justify-center' : 'gap-3'}`}><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{initials}</div><div className={compact ? 'sr-only' : 'min-w-0'}><p className="truncate text-sm font-semibold text-slate-800">{profile?.fullName ?? 'Aarav Kumar'}</p><p className="truncate text-xs text-slate-500">View your passport</p></div></NavLink>
        <div className={compact ? 'sr-only' : 'mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4'}>
          <p className="text-xs font-semibold text-indigo-900">Keep your momentum</p>
          <p className="mt-1 text-xs leading-5 text-indigo-700">Complete one lesson today to protect your 12 day streak.</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-indigo-100"><div className="h-full w-4/5 rounded-full bg-indigo-600" /></div>
        </div>
      </div>
    </aside>
    {mobileNavOpen && <div className="fixed inset-0 z-40 lg:hidden"><button type="button" aria-label="Dismiss navigation overlay" onClick={onClose} className="absolute inset-0 bg-slate-950/30" /><aside role="dialog" aria-modal="true" aria-label="Mobile navigation" className="relative h-full w-[min(18rem,calc(100vw-2rem))] bg-white px-4 py-5 shadow-xl"><div className="flex h-full flex-col"><div className="mb-2 flex justify-end"><button autoFocus type="button" aria-label="Close navigation" onClick={onClose} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><Icon name="x" size={20} /></button></div>{content}</div></aside></div>}
    </>
  )
}
