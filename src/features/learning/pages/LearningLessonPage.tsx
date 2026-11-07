import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../../components/Icon'
import { completeLearningLesson, getLearningEnrollment, getLearningPath, isLessonCompleted } from '../../../services/learningService'

export function LearningLessonPage() {
  const { pathId, lessonId } = useParams()
  const navigate = useNavigate()
  const path = pathId ? getLearningPath(pathId) : undefined
  const lesson = path?.modules.flatMap((item) => item.lessons).find((item) => item.id === lessonId)
  const enrollment = pathId ? getLearningEnrollment(pathId) : undefined
  if (!path || !lesson) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-xl font-bold">Lesson not found</h1><Link to="/learning" className="mt-3 inline-block font-semibold text-indigo-700">Return to Learning Hub</Link></div>
  if (!enrollment) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-xl font-bold">Enroll to unlock this lesson</h1><Link to={`/learning/${path.id}`} className="mt-3 inline-block font-semibold text-indigo-700">View path details</Link></div>
  const completed = isLessonCompleted(path.id, lesson.id)
  const markComplete = () => { const result = completeLearningLesson(path.id, lesson.id); if (result.ok) navigate(`/learning/${path.id}`) }
  return <div className="mx-auto max-w-3xl space-y-6"><Link to={`/learning/${path.id}`} className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-indigo-700"><Icon name="chevron-right" size={16} className="rotate-180" /> Back to path</Link><article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{path.title}</span><h1 className="mt-3 text-3xl font-bold text-slate-950">{lesson.title}</h1><p className="mt-3 text-sm text-slate-500">{lesson.duration} · {completed ? 'Completed' : 'In progress'}</p><p className="mt-6 text-base leading-8 text-slate-700">{lesson.description}</p><div className="mt-6 rounded-xl bg-slate-50 p-5"><h2 className="font-bold text-slate-950">Learning material</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">{lesson.material}</p></div><button type="button" onClick={markComplete} disabled={completed} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-600">{completed ? 'Lesson completed' : 'Mark lesson complete'} <Icon name="check" size={16} /></button></article></div>
}
