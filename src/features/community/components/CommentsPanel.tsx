import { useCallback, useEffect, useState } from 'react'
import type { CommunityContentType } from '../../../types/dashboard'
import { COMMUNITY_CHANGED_EVENT } from '../../../services/communityService'
import { createCommunityComment, deleteCommunityComment, getCommunityComments, updateCommunityComment } from '../../../services/communityInteractionService'

export function CommentsPanel({ contentType, contentId }: { contentType: CommunityContentType; contentId: string }) {
  const [comments, setComments] = useState(() => getCommunityComments(contentType, contentId))
  const [content, setContent] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const refresh = useCallback(() => setComments(getCommunityComments(contentType, contentId)), [contentId, contentType])
  useEffect(() => {
    window.addEventListener(COMMUNITY_CHANGED_EVENT, refresh)
    return () => window.removeEventListener(COMMUNITY_CHANGED_EVENT, refresh)
  }, [contentId, contentType, refresh])
  const ordered = [...comments].sort((a, b) => sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt))
  const submit = () => {
    const result = editingId ? updateCommunityComment(editingId, content) : createCommunityComment(contentType, contentId, content)
    if (!result.ok) setError(result.message)
    else { setContent(''); setError(''); setEditingId(null); setFeedback(result.message); refresh() }
  }
  const remove = (id: string) => {
    if (!window.confirm('Delete this comment?')) return
    const result = deleteCommunityComment(id)
    setFeedback(result.message)
    refresh()
  }
  return <section className="mt-6 border-t border-slate-100 pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold text-slate-950">{comments.length} Comments</h3><select aria-label="Sort comments" value={sort} onChange={(event) => setSort(event.target.value as 'newest' | 'oldest')} className="min-h-10 rounded-lg border border-slate-200 px-2 text-sm"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div>{feedback && <p role="status" className="mt-2 text-sm text-emerald-700">{feedback}</p>}{ordered.length === 0 ? <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No comments yet. Start the conversation.</p> : <div className="mt-4 space-y-3">{ordered.map((comment) => <article key={comment.id} className="rounded-xl bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-slate-800">{comment.authorName}</strong><time className="text-xs text-slate-400">{new Date(comment.updatedAt).toLocaleString()}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.content}</p><div className="mt-2 flex gap-2">{comment.authorId === 'demo-user-aarav-kumar' && <><button type="button" onClick={() => { setEditingId(comment.id); setContent(comment.content); setError('') }} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-indigo-700">Edit</button><button type="button" onClick={() => remove(comment.id)} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-rose-600">Delete</button></>}</div></article>)}</div>}<div className="mt-4"><textarea aria-label="Add a comment" value={content} onChange={(event) => setContent(event.target.value)} className="min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder={editingId ? 'Edit your comment...' : 'Add a comment...'} />{error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}<div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={submit} className="min-h-10 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white">{editingId ? 'Save comment' : 'Post comment'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setContent('') }} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold">Cancel</button>}</div></div></section>
}
