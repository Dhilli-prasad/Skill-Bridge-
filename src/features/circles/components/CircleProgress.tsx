import { useMemo } from 'react'
import { useCircleDiscussions } from '../../../hooks/useCircleDiscussions'
import { useCircleMemberships } from '../../../hooks/useCircleMemberships'
import { useCircleTasks } from '../../../hooks/useCircleTasks'
import { getCircleMembers, getCircleMemberCount } from '../../../services/circleMembership'
import { getPostComments, getTaskStatus } from '../../../services/circleProgressService'
import type { CircleMember, CircleTask, LearningCircle } from '../../../types/dashboard'
import { Icon } from '../../../components/Icon'

interface CircleProgressProps {
  circle: LearningCircle
}

interface MemberProgress {
  member: CircleMember
  assigned: number
  completed: number
  pending: number
  percentage: number
  recentActivity: string
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return <div aria-label={label} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${value}%` }} /></div>
}

function taskCompleted(task: CircleTask) {
  return getTaskStatus(task) === 'Completed'
}

export function CircleProgress({ circle }: CircleProgressProps) {
  const tasks = useCircleTasks(circle.id)
  const posts = useCircleDiscussions(circle.id)
  const { memberships } = useCircleMemberships()
  const members = getCircleMembers(circle)
  const postsWithComments = useMemo(() => posts.map((post) => ({ post, comments: getPostComments(post.id) })), [posts])
  const completed = tasks.filter(taskCompleted).length
  const overdue = tasks.filter((task) => getTaskStatus(task) === 'Overdue').length
  const pending = tasks.length - completed - overdue
  const percentage = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100)
  const memberProgress = useMemo<MemberProgress[]>(() => members.map((member) => {
    const assignedTasks = tasks.filter((task) => task.assignedMemberId === member.id)
    const memberCompleted = assignedTasks.filter(taskCompleted).length
    const activityDates = [
      ...assignedTasks.filter(taskCompleted).map((task) => task.completedAt ?? task.createdAt),
      ...postsWithComments.filter(({ post, comments }) => post.authorId === member.id || comments.some((comment) => comment.authorId === member.id)).flatMap(({ post, comments }) => [
        ...(post.authorId === member.id ? [post.createdAt] : []),
        ...comments.filter((comment) => comment.authorId === member.id).map((comment) => comment.updatedAt ?? comment.createdAt),
      ]),
    ].sort().reverse()
    return {
      member,
      assigned: assignedTasks.length,
      completed: memberCompleted,
      pending: assignedTasks.length - memberCompleted,
      percentage: assignedTasks.length === 0 ? 0 : Math.round((memberCompleted / assignedTasks.length) * 100),
      recentActivity: activityDates[0] ? `Active ${dateLabel(activityDates[0])}` : 'No recorded activity',
    }
  }), [members, postsWithComments, tasks])
  const activityMemberIds = new Set([
    ...tasks.filter((task) => task.assignedMemberId && (task.completed || task.createdAt)).map((task) => task.assignedMemberId as string),
    ...posts.flatMap((post) => [post.authorId, ...getPostComments(post.id).map((comment) => comment.authorId)]),
  ])
  const activeMembers = members.filter((member) => activityMemberIds.has(member.id)).length
  const weekly = useMemo(() => {
    const weeks = [...new Set(tasks.map((task) => task.weekNumber))].sort((a, b) => a - b)
    return weeks.map((week) => {
      const weekTasks = tasks.filter((task) => task.weekNumber === week)
      const weekCompleted = weekTasks.filter(taskCompleted).length
      return { week, completed: weekCompleted, total: weekTasks.length, percentage: weekTasks.length === 0 ? 0 : Math.round((weekCompleted / weekTasks.length) * 100) }
    })
  }, [tasks])
  const recentActivity = useMemo(() => [
    ...tasks.filter(taskCompleted).map((task) => ({ id: `task-${task.id}`, label: `${task.title} completed`, date: task.completedAt ?? task.createdAt })),
    ...posts.flatMap((post) => [
      { id: post.id, label: `${post.authorName} posted “${post.title}”`, date: post.createdAt },
      ...getPostComments(post.id).map((comment) => ({ id: comment.id, label: `${comment.authorName} commented`, date: comment.updatedAt ?? comment.createdAt })),
    ]),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5), [posts, tasks])
  const objectives = circle.objectives?.filter(Boolean) ?? []
  const objectiveItems = objectives.length > 0 ? objectives : [circle.goal]
  const totalMembers = getCircleMemberCount(circle, memberships)

  return <section className="mt-6 border-t border-slate-100 pt-6" aria-labelledby="circle-progress-title">
    <div><h3 id="circle-progress-title" className="text-lg font-semibold text-slate-950">Progress</h3><p className="mt-1 text-sm text-slate-500">A live view built from this circle’s tasks, members, and learning activity.</p></div>
    <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Overall circle progress</p><p className="mt-1 text-3xl font-bold text-slate-950">{percentage}%</p></div><Icon name="target" className="text-indigo-500" size={28} /></div><ProgressBar value={percentage} label={`Overall circle progress: ${percentage}%`} /><p className="mt-2 text-xs text-slate-500">Learning goal progress uses completed tasks divided by all tasks. With no tasks, progress starts at 0%.</p></div>
    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Total tasks</p><p className="mt-1 text-xl font-bold text-slate-900">{tasks.length}</p></div><div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Completed</p><p className="mt-1 text-xl font-bold text-emerald-800">{completed}</p></div><div className="rounded-lg bg-indigo-50 p-3"><p className="text-xs text-indigo-700">Pending</p><p className="mt-1 text-xl font-bold text-indigo-800">{pending}</p></div><div className="rounded-lg bg-rose-50 p-3"><p className="text-xs text-rose-700">Overdue</p><p className="mt-1 text-xl font-bold text-rose-800">{overdue}</p></div><div className="rounded-lg bg-violet-50 p-3"><p className="text-xs text-violet-700">Total members</p><p className="mt-1 text-xl font-bold text-violet-800">{totalMembers}</p></div><div className="rounded-lg bg-amber-50 p-3"><p className="text-xs text-amber-700">Active members</p><p className="mt-1 text-xl font-bold text-amber-800">{activeMembers}</p></div></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><h4 className="font-semibold text-slate-900">Weekly activity</h4><span className="text-xs text-slate-400">{activeMembers} participating</span></div>{weekly.length === 0 ? <p className="mt-4 text-sm text-slate-500">No weekly task activity yet.</p> : <div className="mt-4 space-y-3">{weekly.map((item) => <div key={item.week}><div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-slate-700">Week {item.week}</span><span className="text-slate-500">{item.completed}/{item.total} completed</span></div><ProgressBar value={item.percentage} label={`Week ${item.week}: ${item.percentage}% complete`} /></div>)}</div>}<p className="mt-4 text-xs text-slate-400">Participation counts members with assigned task activity or discussion posts/comments.</p></div>
      <div className="rounded-xl border border-slate-200 p-4"><h4 className="font-semibold text-slate-900">Learning goals & milestones</h4><p className="mt-1 text-xs text-slate-500">Objectives are displayed from the circle definition. Their achievement follows the shared task completion percentage because tasks do not currently link to individual objectives.</p><div className="mt-3 space-y-2">{objectiveItems.map((objective) => <div key={objective} className="flex items-start gap-2 rounded-lg bg-slate-50 p-3"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${percentage === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}><Icon name={percentage === 100 ? 'check' : 'target'} size={13} /></span><div><p className="text-sm font-semibold text-slate-700">{objective}</p><p className="text-xs text-slate-400">{percentage === 100 ? 'Milestone achieved' : 'Upcoming milestone'}</p></div></div>)}</div></div>
    </div>
    <div className="mt-4 rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><h4 className="font-semibold text-slate-900">Member progress</h4><span className="text-xs text-slate-400">Assigned tasks only</span></div><p className="mt-1 text-xs text-slate-500">Unassigned tasks remain in circle totals but are not included in any member’s completion percentage.</p>{memberProgress.length === 0 ? <p className="mt-4 text-sm text-slate-500">No member records are available.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{memberProgress.map((item) => <article key={item.member.id} className="rounded-lg border border-slate-100 p-3"><div className="flex items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials(item.member.name)}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h5 className="truncate text-sm font-semibold text-slate-800">{item.member.name}</h5><span className="text-xs font-bold text-indigo-600">{item.percentage}%</span></div><p className="mt-1 text-xs text-slate-500">{item.completed} completed · {item.pending} pending · {item.assigned} assigned</p><ProgressBar value={item.percentage} label={`${item.member.name} progress: ${item.percentage}%`} /><p className="mt-2 text-[11px] text-slate-400">{item.recentActivity}</p></div></div></article>)}</div>}</div>
    <div className="mt-4 rounded-xl border border-slate-200 p-4"><h4 className="font-semibold text-slate-900">Recent learning activity</h4>{recentActivity.length === 0 ? <p className="mt-2 text-sm text-slate-500">No recorded learning activity yet.</p> : <ul className="mt-3 space-y-2">{recentActivity.map((activity) => <li key={activity.id} className="flex items-start gap-2 text-sm text-slate-600"><Icon name="check" size={15} className="mt-0.5 text-emerald-500" /><span>{activity.label} <span className="text-xs text-slate-400">· {dateLabel(activity.date)}</span></span></li>)}</ul>}</div>
  </section>
}
