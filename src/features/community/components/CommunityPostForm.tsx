import { useState } from 'react'
import type { FormEvent } from 'react'
import { createCommunityPost } from '../../../services/communityService'
import type { CommunityCategory } from '../../../types/dashboard'

const categories: CommunityCategory[] = ['Web Development', 'JavaScript', 'Python', 'Java', 'AWS and Cloud', 'Artificial Intelligence', 'Data Science', 'Cybersecurity', 'Open Source', 'Career and Learning']

export function CommunityPostForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (message: string) => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<CommunityCategory>('Web Development')
  const [tags, setTags] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const nextErrors: string[] = []
    if (!title.trim()) nextErrors.push('Add a post title.')
    if (!content.trim()) nextErrors.push('Add some post content.')
    if (title.trim().length > 100) nextErrors.push('Title must be 100 characters or fewer.')
    if (content.trim().length > 2000) nextErrors.push('Content must be 2,000 characters or fewer.')
    setErrors(nextErrors)
    if (nextErrors.length) return
    setSaving(true)
    window.setTimeout(() => {
      const result = createCommunityPost({ title, content, category, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean) })
      onCreated(result.message)
      setSaving(false)
      if (result.ok) onCancel()
    }, 250)
  }
  const input = 'mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><button type="button" aria-label="Close create community post" onClick={onCancel} className="absolute inset-0 bg-slate-950/40" /><form onSubmit={submit} noValidate className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-bold text-slate-950">Create a community post</h2><p className="mt-1 text-sm text-slate-500">Share something useful with fellow developers.</p>{errors.length > 0 && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><ul className="list-disc pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}<div className="mt-5 space-y-4"><label className="block text-sm font-semibold text-slate-700">Category<select value={category} onChange={(event) => setCategory(event.target.value as CommunityCategory)} className={input}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Title<input aria-label="Post title" maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} className={input} placeholder="What are you building or learning?" /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{title.length}/100</span></label><label className="block text-sm font-semibold text-slate-700">Content<textarea aria-label="Post content" maxLength={2000} value={content} onChange={(event) => setContent(event.target.value)} className={`${input} min-h-32 resize-y`} placeholder="Share your idea, lesson, or question." /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{content.length}/2000</span></label><label className="block text-sm font-semibold text-slate-700">Tags <span className="font-normal text-slate-400">(comma separated)</span><input value={tags} onChange={(event) => setTags(event.target.value)} className={input} placeholder="React, Testing" /></label></div><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Publishing...' : 'Publish post'}</button></div></form></div>
}
