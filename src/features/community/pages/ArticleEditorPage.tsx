import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArticleContent } from '../components/ArticleContent'
import { Icon } from '../../../components/Icon'
import { createCommunityArticle, getCommunityArticle, updateCommunityArticle } from '../../../services/communityArticleService'
import type { CommunityCategory } from '../../../types/dashboard'

const categories: CommunityCategory[] = ['Web Development', 'JavaScript', 'Python', 'Java', 'AWS and Cloud', 'Artificial Intelligence', 'Data Science', 'Cybersecurity', 'Open Source', 'Career and Learning']

export function ArticleEditorPage() {
  const { articleId } = useParams()
  const navigate = useNavigate()
  const existing = useMemo(() => articleId ? getCommunityArticle(articleId) : undefined, [articleId])
  const [title, setTitle] = useState(existing?.title ?? '')
  const [subtitle, setSubtitle] = useState(existing?.subtitle ?? '')
  const [content, setContent] = useState(existing?.content ?? '')
  const [category, setCategory] = useState<CommunityCategory>(existing?.category ?? 'Web Development')
  const [tags, setTags] = useState(existing?.tags.join(', ') ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(existing?.coverImageUrl ?? '')
  const [errors, setErrors] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const words = content.trim() ? content.trim().split(/\s+/).length : 0
  const applyMarkup = (prefix: string, suffix = prefix) => setContent((current) => `${current}${current ? '\n' : ''}${prefix}your text${suffix}`)
  const save = (status: 'Draft' | 'Published') => {
    if (saving) return
    const nextErrors: string[] = []
    if (!title.trim()) nextErrors.push('Add an article title.')
    if (!content.trim()) nextErrors.push('Add article content.')
    if (title.trim().length > 120) nextErrors.push('Title must be 120 characters or fewer.')
    if (subtitle.trim().length > 240) nextErrors.push('Subtitle must be 240 characters or fewer.')
    if (content.trim().length > 20000) nextErrors.push('Content must be 20,000 characters or fewer.')
    if (status === 'Published' && words < 10) nextErrors.push('Add at least 10 words before publishing.')
    setErrors(nextErrors)
    if (nextErrors.length) return
    setSaving(true)
    window.setTimeout(() => {
      const input = { title, subtitle, content, category, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), coverImageUrl, status }
      const result = existing ? updateCommunityArticle(existing.id, input) : createCommunityArticle(input)
      setSaving(false)
      setFeedback(result.message)
      if (result.ok && result.article) navigate(`/community/articles/${result.article.id}`)
    }, 250)
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    save('Published')
  }
  if (articleId && !existing) return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center"><h1 className="text-xl font-bold text-rose-900">Article not found</h1><Link to="/community" className="mt-4 inline-block font-semibold text-indigo-700">Return to community</Link></div>
  const input = 'mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
  return <div className="mx-auto max-w-6xl space-y-6"><header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-600">Developer Community</p><h1 className="mt-1 text-3xl font-bold text-slate-950">{existing ? 'Edit article' : 'Write an article'}</h1><p className="mt-2 text-sm text-slate-500">Share a thoughtful guide with fellow developers.</p></div><Link to="/community" className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"><Icon name="chevron-right" size={16} className="rotate-180" /> Back to community</Link></header>{feedback && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>}{errors.length > 0 && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><ul className="list-disc pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><form onSubmit={submit} noValidate className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><label className="block text-sm font-semibold text-slate-700">Article title<input aria-label="Article title" maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className={input} placeholder="A practical guide to..." /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{title.length}/120</span></label><label className="block text-sm font-semibold text-slate-700">Subtitle<input aria-label="Article subtitle" maxLength={240} value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className={input} placeholder="Set the context for your readers." /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{subtitle.length}/240</span></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Category<select aria-label="Article category" value={category} onChange={(event) => setCategory(event.target.value as CommunityCategory)} className={input}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Tags<input aria-label="Article tags" value={tags} onChange={(event) => setTags(event.target.value)} className={input} placeholder="React, Testing" /></label></div><label className="block text-sm font-semibold text-slate-700">Cover image URL <span className="font-normal text-slate-400">(optional)</span><input aria-label="Cover image URL" type="url" value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} className={input} placeholder="https://..." /></label><label className="block text-sm font-semibold text-slate-700">Article content<textarea aria-label="Article content" value={content} onChange={(event) => setContent(event.target.value)} className={`${input} min-h-[360px] resize-y font-mono`} placeholder="# Your heading&#10;&#10;Write your article here..." /></label><div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => applyMarkup('**')} className="min-h-10 rounded-lg bg-slate-100 px-3 text-sm font-bold">B</button><button type="button" onClick={() => applyMarkup('*')} className="min-h-10 rounded-lg bg-slate-100 px-3 text-sm italic">I</button><button type="button" onClick={() => applyMarkup('# ', '')} className="min-h-10 rounded-lg bg-slate-100 px-3 text-sm font-bold">H</button><button type="button" onClick={() => applyMarkup('- ', '')} className="min-h-10 rounded-lg bg-slate-100 px-3 text-sm">List</button><button type="button" onClick={() => applyMarkup('```\\n', '\\n```')} className="min-h-10 rounded-lg bg-slate-100 px-3 font-mono text-sm">Code</button><button type="button" onClick={() => setPreview((value) => !value)} className="ml-auto min-h-10 rounded-lg bg-indigo-50 px-3 text-sm font-semibold text-indigo-700">{preview ? 'Edit' : 'Preview'}</button></div><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={saving} onClick={() => save('Draft')} className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-70">Save draft</button><button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Saving...' : 'Publish article'}</button></div></form><section className="min-h-[500px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{preview ? 'Preview' : 'Live preview'}</p><h2 className="mt-3 text-3xl font-bold text-slate-950">{title || 'Your article title'}</h2>{subtitle && <p className="mt-3 text-lg text-slate-500">{subtitle}</p>}<div className="mt-6"><ArticleContent content={content || 'Your formatted article will appear here.'} /></div><p className="mt-6 text-sm text-slate-400">{words} words · {content.length} characters</p></section></div></div>
}
