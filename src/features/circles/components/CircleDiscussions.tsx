import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useCircleDiscussions } from '../../../hooks/useCircleDiscussions'
import {
  addComment,
  createDiscussionPost,
  deleteComment,
  deleteDiscussionPost,
  getPostComments,
  getPostLikeCount,
  hasLikedPost,
  MAX_COMMENT_LENGTH,
  MAX_CONTENT_LENGTH,
  MAX_TITLE_LENGTH,
  removeDiscussionPost,
  setPostPinned,
  togglePostLike,
  updateComment,
  updateDiscussionPost,
} from '../../../services/discussionService'
import { DEMO_USER_ID, getCircleMembers, isMember } from '../../../services/circleMembership'
import type { CircleDiscussionComment, CircleDiscussionPost, DiscussionPostType, LearningCircle } from '../../../types/dashboard'
import { Icon } from '../../../components/Icon'

interface CircleDiscussionsProps { circle: LearningCircle; onFeedback: (message: string) => void }
type DiscussionFilter = 'All' | DiscussionPostType | 'Most liked'

const typeStyles: Record<DiscussionPostType, string> = {
  Discussion: 'bg-indigo-50 text-indigo-700',
  Question: 'bg-amber-50 text-amber-700',
  Announcement: 'bg-emerald-50 text-emerald-700',
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

function dateLabel(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function PostForm({ circle, onCancel, onCreated, post }: { circle: LearningCircle; onCancel: () => void; onCreated: (message: string) => void; post?: CircleDiscussionPost }) {
  const [type, setType] = useState<DiscussionPostType>(post?.type ?? 'Discussion')
  const [title, setTitle] = useState(post?.title ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const nextErrors: string[] = []
    if (!title.trim()) nextErrors.push('Add a post title.')
    if (!content.trim()) nextErrors.push('Add some post content.')
    if (title.trim().length > MAX_TITLE_LENGTH) nextErrors.push(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`)
    if (content.trim().length > MAX_CONTENT_LENGTH) nextErrors.push(`Content must be ${MAX_CONTENT_LENGTH} characters or fewer.`)
    setErrors(nextErrors)
    if (nextErrors.length) return
    setSaving(true)
    window.setTimeout(() => {
      const result = post
        ? updateDiscussionPost(circle, post.id, title, content)
        : createDiscussionPost(circle, { circleId: circle.id, type, title, content })
      onCreated(result.message)
      setSaving(false)
      if (result.ok) onCancel()
    }, 250)
  }
  const inputClass = 'mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
  return <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><button type="button" aria-label="Close discussion form" onClick={onCancel} className="absolute inset-0 bg-slate-950/40" /><form onSubmit={submit} noValidate className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{post ? 'Edit your post' : 'Circle discussion'}</p><h4 className="mt-2 text-xl font-bold text-slate-950">{post ? 'Edit discussion' : 'Start a discussion'}</h4></div><button type="button" aria-label="Close discussion form" onClick={onCancel} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><Icon name="x" /></button></div>{errors.length > 0 && <div role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><ul className="list-disc space-y-1 pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}<div className="mt-5 space-y-4">{!post && <label className="block text-sm font-semibold text-slate-700">Post type<select value={type} onChange={(event) => setType(event.target.value as DiscussionPostType)} className={inputClass}><option>Discussion</option><option>Question</option><option>Announcement</option></select></label>}<label className="block text-sm font-semibold text-slate-700">Post title<span className="ml-1 text-rose-500">*</span><input maxLength={MAX_TITLE_LENGTH} value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder="What would you like to share?" /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{title.length}/{MAX_TITLE_LENGTH}</span></label><label className="block text-sm font-semibold text-slate-700">Post content<span className="ml-1 text-rose-500">*</span><textarea maxLength={MAX_CONTENT_LENGTH} value={content} onChange={(event) => setContent(event.target.value)} className={`${inputClass} min-h-32 resize-y`} placeholder="Share an idea, question, or helpful update." /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{content.length}/{MAX_CONTENT_LENGTH}</span></label></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70">{saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}{saving ? 'Saving...' : post ? 'Save changes' : 'Publish post'}</button></div></form></div>
}

function CommentItem({ circle, comment, onFeedback }: { circle: LearningCircle; comment: CircleDiscussionComment; onFeedback: (message: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(comment.content)
  const own = comment.authorId === DEMO_USER_ID
  const submit = () => {
    const result = updateComment(circle, comment.id, content)
    onFeedback(result.message)
    if (result.ok) setEditing(false)
  }
  return <div className="flex gap-3 border-t border-slate-100 py-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials(comment.authorName)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-slate-700">{comment.authorName}</span><span className="text-xs text-slate-400">{dateLabel(comment.createdAt)}{comment.updatedAt ? ' · edited' : ''}</span></div>{editing ? <div className="mt-2 flex gap-2"><textarea aria-label="Edit comment" value={content} onChange={(event) => setContent(event.target.value)} maxLength={MAX_COMMENT_LENGTH} className="min-h-16 flex-1 rounded-lg border border-slate-200 p-2 text-sm" /><button type="button" onClick={submit} className="min-h-10 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white">Save</button></div> : <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-600">{comment.content}</p>}{own && <div className="mt-1 flex gap-3 text-xs font-semibold text-slate-500"><button type="button" onClick={() => setEditing(true)} className="hover:text-indigo-600">Edit</button><button type="button" onClick={() => { if (window.confirm('Delete this comment?')) onFeedback(deleteComment(circle, comment.id).message) }} className="hover:text-rose-600">Delete</button></div>}</div></div>
}

export function CircleDiscussions({ circle, onFeedback }: CircleDiscussionsProps) {
  const posts = useCircleDiscussions(circle.id)
  const members = getCircleMembers(circle)
  const [filter, setFilter] = useState<DiscussionFilter>('All')
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<CircleDiscussionPost | undefined>()
  const [openActions, setOpenActions] = useState<string | null>(null)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [, refresh] = useState(0)
  const canModerate = circle.creator === 'Aarav Kumar' || members.some((member) => member.id === DEMO_USER_ID && (member.role === 'Owner' || member.role === 'Moderator'))
  const canParticipate = circle.creator === 'Aarav Kumar' || isMember(circle.id)
  const visiblePosts = useMemo(() => [...posts].filter((post) => filter === 'All' || filter === 'Most liked' || post.type === filter).sort((a, b) => filter === 'Most liked' ? getPostLikeCount(b.id) - getPostLikeCount(a.id) || b.createdAt.localeCompare(a.createdAt) : b.createdAt.localeCompare(a.createdAt)), [filter, posts])
  const feedback = (message: string) => { onFeedback(message); refresh((value) => value + 1) }
  const submitComment = (postId: string) => { const result = addComment(circle, postId, commentDrafts[postId] ?? ''); feedback(result.message); if (result.ok) setCommentDrafts((current) => ({ ...current, [postId]: '' })) }
  return <section className="mt-6 border-t border-slate-100 pt-6" aria-labelledby="circle-discussions-title"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h3 id="circle-discussions-title" className="text-lg font-semibold text-slate-950">Discussions</h3><p className="mt-1 text-sm text-slate-500">Share progress, ask questions, and help your circle move forward.</p></div>{canParticipate ? <button type="button" onClick={() => setShowForm(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><Icon name="plus" size={16} /> Start discussion</button> : <p className="text-xs font-medium text-slate-500">Join this circle to participate.</p>}</div><div className="mt-4 flex flex-wrap gap-2">{(['All', 'Most liked', 'Question', 'Announcement', 'Discussion'] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`min-h-10 rounded-full px-3 text-xs font-semibold ${filter === item ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item === 'All' ? 'Newest' : item}</button>)}</div>{visiblePosts.length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center"><p className="font-semibold text-slate-700">No discussions yet</p><p className="mt-1 text-sm text-slate-500">Be the first to start a conversation in this circle.</p></div> : <div className="mt-4 space-y-4">{visiblePosts.map((post) => { const comments = getPostComments(post.id); const liked = hasLikedPost(post.id); const expanded = expandedComments[post.id] ?? false; const own = post.authorId === DEMO_USER_ID; return <article key={post.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{initials(post.authorName)}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-900">{post.authorName}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{post.authorRole}</span><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${typeStyles[post.type]}`}>{post.type}</span>{post.pinned && <span className="text-xs font-semibold text-amber-600">Pinned</span>}</div><p className="mt-1 text-xs text-slate-400">{dateLabel(post.createdAt)}</p></div></div><div className="relative"><button type="button" aria-label={`More actions for ${post.title}`} onClick={() => setOpenActions(openActions === post.id ? null : post.id)} className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><Icon name="more-horizontal" /></button>{openActions === post.id && <div className="absolute right-0 top-11 z-10 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">{own && <><button type="button" onClick={() => { setEditingPost(post); setShowForm(true); setOpenActions(null) }} className="block min-h-10 w-full rounded px-3 text-left text-sm hover:bg-slate-50">Edit post</button><button type="button" onClick={() => { if (window.confirm('Delete this discussion and its comments?')) feedback(deleteDiscussionPost(circle, post.id).message); setOpenActions(null) }} className="block min-h-10 w-full rounded px-3 text-left text-sm text-rose-600 hover:bg-rose-50">Delete post</button></>}{canModerate && <><button type="button" onClick={() => { feedback(setPostPinned(circle, post.id, !post.pinned).message); setOpenActions(null) }} className="block min-h-10 w-full rounded px-3 text-left text-sm hover:bg-slate-50">{post.pinned ? 'Unpin post' : 'Pin post'}</button><button type="button" onClick={() => { if (window.confirm('Remove this discussion?')) feedback(removeDiscussionPost(circle, post.id).message); setOpenActions(null) }} className="block min-h-10 w-full rounded px-3 text-left text-sm text-rose-600 hover:bg-rose-50">Remove post</button></>}</div>}</div></div><h4 className="mt-4 text-base font-semibold text-slate-950">{post.title}</h4><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{post.content}</p><div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"><button type="button" aria-pressed={liked} onClick={() => feedback(togglePostLike(post.id).message)} className={`min-h-10 rounded-lg px-3 text-xs font-semibold ${liked ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{liked ? 'Liked' : 'Like'} · {getPostLikeCount(post.id)}</button><button type="button" onClick={() => setExpandedComments((current) => ({ ...current, [post.id]: !expanded }))} className="min-h-10 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-200">Comments · {comments.length}</button></div>{expanded && <div className="mt-3"><div className="max-h-64 overflow-y-auto">{comments.length === 0 ? <p className="py-3 text-sm text-slate-400">No comments yet.</p> : comments.map((comment) => <CommentItem key={comment.id} circle={circle} comment={comment} onFeedback={feedback} />)}</div><div className="mt-3 flex gap-2"><input aria-label={`Comment on ${post.title}`} value={commentDrafts[post.id] ?? ''} maxLength={MAX_COMMENT_LENGTH} onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))} placeholder="Add a comment..." className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm" /><button type="button" onClick={() => submitComment(post.id)} className="min-h-11 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white">Post</button></div></div>}</article>})}</div>}{showForm && <PostForm circle={circle} post={editingPost} onCancel={() => { setShowForm(false); setEditingPost(undefined) }} onCreated={feedback} />}</section>
}
