import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { circleCategories, circleDifficulties } from '../../../data/mockData'
import { saveCreatedLearningCircle } from '../../../services/circleStorage'
import type { CircleCategory, CircleDifficulty, CreateLearningCircleInput, LearningCircle } from '../../../types/dashboard'
import { Icon } from '../../../components/Icon'

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const durations = ['2 weeks', '4 weeks', '6 weeks', '8 weeks', '12 weeks']

type FormErrors = Partial<Record<keyof CreateLearningCircleInput | 'form', string>>

const fieldClass = 'mt-2 min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'

function validate(form: CreateLearningCircleInput): FormErrors {
  const errors: FormErrors = {}
  if (!form.name.trim()) errors.name = 'Give your circle a clear name.'
  if (form.name.trim().length > 60) errors.name = 'Circle names must be 60 characters or fewer.'
  if (!form.description.trim()) errors.description = 'Add a short description to help people find the right circle.'
  if (form.description.trim().length > 300) errors.description = 'Descriptions must be 300 characters or fewer.'
  if (!form.category) errors.category = 'Choose a technology category.'
  if (!form.difficulty) errors.difficulty = 'Choose a difficulty level.'
  if (form.objectives.filter((objective) => objective.trim()).length === 0) errors.objectives = 'Add at least one learning objective.'
  if (!Number.isInteger(form.capacity) || form.capacity < 3 || form.capacity > 50) errors.capacity = 'Maximum members must be between 3 and 50.'
  if (form.meetingDays.length === 0) errors.meetingDays = 'Choose at least one meeting day.'
  if (!form.meetingTime) errors.meetingTime = 'Choose a meeting time.'
  if (!durations.includes(form.duration)) errors.duration = 'Choose a circle duration.'
  return errors
}

export function CreateCircleForm() {
  const navigate = useNavigate()
  const [form, setForm] = useState<CreateLearningCircleInput>({
    name: '',
    description: '',
    category: 'Web Development',
    difficulty: 'Beginner',
    objectives: [''],
    capacity: 10,
    meetingDays: [],
    meetingTime: '',
    duration: '4 weeks',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const updateForm = <K extends keyof CreateLearningCircleInput>(key: K, value: CreateLearningCircleInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }))
  }

  const toggleDay = (day: string) => {
    const days = form.meetingDays.includes(day) ? form.meetingDays.filter((item) => item !== day) : [...form.meetingDays, day]
    updateForm('meetingDays', days)
  }

  const updateObjective = (index: number, value: string) => {
    const objectives = form.objectives.map((objective, objectiveIndex) => objectiveIndex === index ? value : objective)
    updateForm('objectives', objectives)
  }

  const addObjective = () => updateForm('objectives', [...form.objectives, ''])

  const removeObjective = (index: number) => {
    if (form.objectives.length === 1) return
    updateForm('objectives', form.objectives.filter((_, objectiveIndex) => objectiveIndex !== index))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    window.setTimeout(() => {
      const circle: LearningCircle = {
        id: `created-${Date.now()}`,
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        difficulty: form.difficulty,
        creator: 'Aarav Kumar',
        members: 4,
        capacity: form.capacity,
        goal: form.objectives.filter((objective) => objective.trim()).join(' · '),
        schedule: `${form.meetingDays.join(', ')} · ${form.meetingTime}`,
        duration: form.duration,
        createdAt: new Date().toISOString().slice(0, 10),
        progress: 0,
        featured: false,
        objectives: form.objectives.filter((objective) => objective.trim()),
        meetingDays: form.meetingDays,
        meetingTime: form.meetingTime,
      }

      if (saveCreatedLearningCircle(circle)) {
        setSuccess(true)
      } else {
        setErrors({ form: 'This circle could not be saved in local demo storage. Check your browser storage settings and try again.' })
      }
      setSubmitting(false)
    }, 500)
  }

  if (success) {
    return <section role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center sm:p-10"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Icon name="check" size={28} /></div><h2 className="mt-5 text-2xl font-bold text-slate-950">Your circle is ready</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">It has been saved in this browser as local demo data. It is not synchronized across users or devices.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={() => navigate('/circles')} className="min-h-11 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">View learning circles</button><button type="button" onClick={() => navigate('/')} className="min-h-11 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to dashboard</button></div></section>
  }

  return <form onSubmit={handleSubmit} noValidate className="space-y-6">
    {errors.form && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errors.form}</div>}
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100 sm:p-6">
      <div className="mb-5"><h2 className="font-semibold text-slate-950">Circle basics</h2><p className="mt-1 text-sm text-slate-500">Set the direction and audience for your learning community.</p></div>
      <div className="grid gap-5">
        <label className="block text-sm font-semibold text-slate-700">Circle name<span className="ml-1 text-rose-500">*</span><input value={form.name} maxLength={60} onChange={(event) => updateForm('name', event.target.value)} className={fieldClass} placeholder="e.g. 30 Days of Python" aria-invalid={Boolean(errors.name)} />{errors.name && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.name}</span>}<span className="mt-1 block text-xs font-normal text-slate-400">{form.name.length}/60 characters</span></label>
        <label className="block text-sm font-semibold text-slate-700">Description<span className="ml-1 text-rose-500">*</span><textarea value={form.description} maxLength={300} onChange={(event) => updateForm('description', event.target.value)} className={`${fieldClass} min-h-28 resize-y`} placeholder="What will members learn or build together?" aria-invalid={Boolean(errors.description)} />{errors.description && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.description}</span>}<span className="mt-1 block text-xs font-normal text-slate-400">{form.description.length}/300 characters</span></label>
        <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Technology category<span className="ml-1 text-rose-500">*</span><select value={form.category} onChange={(event) => updateForm('category', event.target.value as CircleCategory)} className={fieldClass}>{circleCategories.map((category) => <option key={category}>{category}</option>)}</select>{errors.category && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.category}</span>}</label><label className="block text-sm font-semibold text-slate-700">Difficulty<span className="ml-1 text-rose-500">*</span><select value={form.difficulty} onChange={(event) => updateForm('difficulty', event.target.value as CircleDifficulty)} className={fieldClass}>{circleDifficulties.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select>{errors.difficulty && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.difficulty}</span>}</label></div>
      </div>
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100 sm:p-6">
      <div className="mb-5"><h2 className="font-semibold text-slate-950">Learning plan</h2><p className="mt-1 text-sm text-slate-500">Make the commitment clear and manageable for everyone.</p></div>
      <div className="space-y-5">
        <fieldset><legend className="text-sm font-semibold text-slate-700">Learning objectives<span className="ml-1 text-rose-500">*</span></legend><p className="mt-1 text-xs text-slate-400">Add one or more concrete outcomes.</p><div className="mt-3 space-y-3">{form.objectives.map((objective, index) => <div key={`objective-${index}`} className="flex gap-2"><input value={objective} onChange={(event) => updateObjective(index, event.target.value)} className={fieldClass.replace('mt-2 ', 'mt-0 ')} placeholder={`Objective ${index + 1}`} aria-label={`Learning objective ${index + 1}`} />{form.objectives.length > 1 && <button type="button" onClick={() => removeObjective(index)} aria-label={`Remove objective ${index + 1}`} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700"><Icon name="x" size={16} /></button>}</div>)}</div>{errors.objectives && <p className="mt-1 text-xs text-rose-600">{errors.objectives}</p>}<button type="button" onClick={addObjective} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"><Icon name="plus" size={16} /> Add objective</button></fieldset>
        <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Maximum members<span className="ml-1 text-rose-500">*</span><input type="number" min={3} max={50} value={form.capacity} onChange={(event) => updateForm('capacity', Number(event.target.value))} className={fieldClass} aria-describedby="member-help" />{errors.capacity && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.capacity}</span>}<span id="member-help" className="mt-1 block text-xs font-normal text-slate-400">Choose between 3 and 50 members.</span></label><label className="block text-sm font-semibold text-slate-700">Duration<span className="ml-1 text-rose-500">*</span><select value={form.duration} onChange={(event) => updateForm('duration', event.target.value)} className={fieldClass}>{durations.map((duration) => <option key={duration}>{duration}</option>)}</select>{errors.duration && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.duration}</span>}</label></div>
      </div>
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100 sm:p-6">
      <div className="mb-5"><h2 className="font-semibold text-slate-950">Weekly rhythm</h2><p className="mt-1 text-sm text-slate-500">Pick when your circle will meet. Members can coordinate details later.</p></div>
      <fieldset><legend className="text-sm font-semibold text-slate-700">Weekly schedule<span className="ml-1 text-rose-500">*</span></legend><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">{weekDays.map((day) => <label key={day} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-2 text-center text-xs font-semibold transition ${form.meetingDays.includes(day) ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><input type="checkbox" checked={form.meetingDays.includes(day)} onChange={() => toggleDay(day)} className="sr-only" />{day.slice(0, 3)}</label>)}</div>{errors.meetingDays && <p className="mt-1 text-xs text-rose-600">{errors.meetingDays}</p>}</fieldset>
      <label className="mt-5 block text-sm font-semibold text-slate-700 sm:max-w-xs">Meeting time<span className="ml-1 text-rose-500">*</span><input type="time" value={form.meetingTime} onChange={(event) => updateForm('meetingTime', event.target.value)} className={fieldClass} aria-invalid={Boolean(errors.meetingTime)} />{errors.meetingTime && <span className="mt-1 block text-xs font-normal text-rose-600">{errors.meetingTime}</span>}</label>
    </section>
    <p className="rounded-lg bg-slate-100 p-3 text-xs leading-5 text-slate-500">Local demo storage only: this circle is saved in this browser and will not sync across users or devices.</p>
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => navigate('/circles')} className="min-h-11 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={submitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70">{submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />} {submitting ? 'Saving circle...' : 'Create learning circle'}</button></div>
  </form>
}
