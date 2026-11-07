import {
  BadgeCheck, BookOpen, CalendarDays, Check, ChevronDown, ChevronRight, Clock3, Code2, Flame, FolderKanban,
  LayoutDashboard, Menu, MessagesSquare, MoreHorizontal, Plus, Repeat2, Search, Settings2, Map, ChevronLeft,
  SlidersHorizontal, Sparkles, Target, TerminalSquare, UserRound, UsersRound, X, Bookmark, Heart, ExternalLink,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  'badge-check': BadgeCheck, 'book-open': BookOpen, 'calendar-days': CalendarDays, check: Check, 'chevron-down': ChevronDown,
  'chevron-right': ChevronRight, 'chevron-left': ChevronLeft, 'clock-3': Clock3, 'code-2': Code2, flame: Flame,
  'folder-kanban': FolderKanban, 'layout-dashboard': LayoutDashboard, menu: Menu,
  'messages-square': MessagesSquare, 'more-horizontal': MoreHorizontal, plus: Plus,
  'repeat-2': Repeat2, search: Search, 'settings-2': Settings2, map: Map, 'sliders-horizontal': SlidersHorizontal,
  sparkles: Sparkles, target: Target, 'terminal-square': TerminalSquare, 'user-round': UserRound,
  'users-round': UsersRound, x: X,
  bookmark: Bookmark, heart: Heart, 'external-link': ExternalLink,
}

export function Icon({ name, size = 18, strokeWidth = 2, className }: { name: string; size?: number; strokeWidth?: number; className?: string }) {
  const Component = icons[name] ?? Sparkles
  return <Component aria-hidden="true" size={size} strokeWidth={strokeWidth} className={className} />
}
