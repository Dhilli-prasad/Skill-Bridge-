import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCommunityQuestion, updateCommunityQuestion } from '../../../services/communityQuestionService'
import type { CommunityCategory, CommunityQuestion } from '../../../types/dashboard'

const categories: CommunityCategory[] = ['Web Development', 'JavaScript', 'Python', 'Java', 'AWS and Cloud', 'Artificial Intelligence', 'Data Science', 'Cybersecurity', 'Open Source', 'Career and Learning']

export function QuestionForm({ existing, onCancel }: { existing?: CommunityQuestion; onCancel: () => void }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(existing?.title ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [category, setCategory] = useState<CommunityCategory>(existing?.category ?? 'Web Development')
  const [tags, setTags] = useState(existing?.tags.join(', ') ?? '')
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const nextErrors: string[] = []
    if (!title.trim()) nextErrors.push('Add a question title.')
    if (!description.trim()) nextErrors.push('Describe what you tried and where you are stuck.')
    if (title.trim().length > 140) nextErrors.push('Title must be 140 characters or fewer.')
    if (description.trim().length > 5000) nextErrors.push('Description must be 5,000 characters or fewer.')
    setErrors(nextErrors)
    if (nextErrors.length) return
    setSaving(true)
    window.setTimeout(() => {
      const input = { title, description, category, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean) }
      const result = existing ? updateCommunityQuestion(existing.id, input) : createCommunityQuestion(input)
      setSaving(false)
      if (result.ok && result.question) navigate(`/community/questions/${result.question.id}`)
      else setErrors([result.message])
    }, 250)
  }
  const input = 'mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
  return <form onSubmit={submit} noValidate className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h1 className="text-2xl font-bold text-slate-950">{existing ? 'Edit question' : 'Ask a question'}</h1><p className="text-sm text-slate-500">Give the community enough context to provide a useful answer.</p>{errors.length > 0 && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><ul className="list-disc pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}<label className="block text-sm font-semibold text-slate-700">Title<input aria-label="Question title" maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} className={input} placeholder="What are you trying to solve?" /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{title.length}/140</span></label><label className="block text-sm font-semibold text-slate-700">Detailed description<textarea aria-label="Question description" maxLength={5000} value={description} onChange={(event) => setDescription(event.target.value)} className={`${input} min-h-48 resize-y`} placeholder="Include what you tried, expected behavior, and relevant context." /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{description.length}/5000</span></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Category<select aria-label="Question category" value={category} onChange={(event) => setCategory(event.target.value as CommunityCategory)} className={input}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Technology tags<input aria-label="Technology tags" value={tags} onChange={(event) => setTags(event.target.value)} className={input} placeholder="React, Testing" /></label></div><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="min-h-11 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70">{saving ? 'Saving...' : existing ? 'Save changes' : 'Post question'}</button></div></form>
}
