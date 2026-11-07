import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../../../components/Icon'
import { COMMUNITY_USER_ID } from '../../../services/communityService'
import { createCommunityAnswer, deleteCommunityAnswer, deleteCommunityQuestion, getCommunityAnswers, getCommunityQuestion, getCommunityVoteCount, hasCommunityVoted, setAcceptedCommunityAnswer, toggleCommunityVote, updateCommunityAnswer } from '../../../services/communityQuestionService'
import { useCommunityQuestions } from '../../../hooks/useCommunityQuestions'
import { QuestionForm } from '../components/QuestionForm'
import { CommentsPanel } from '../components/CommentsPanel'
import { ReactionButton } from '../components/ReactionButton'

export function QuestionDetailPage() {
  const { questionId } = useParams()
  const navigate = useNavigate()
  const questions = useCommunityQuestions()
  const question = questionId ? getCommunityQuestion(questionId) : undefined
  const [refresh, setRefresh] = useState(0)
  const [answer, setAnswer] = useState('')
  const [answerError, setAnswerError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [editing, setEditing] = useState(false)
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null)
  void refresh
  void questions
  if (!question) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-xl font-bold text-slate-950">Question not found</h1><Link to="/community/questions" className="mt-4 inline-block font-semibold text-indigo-700">Return to questions</Link></div>
  if (editing) return <div className="space-y-4"><button type="button" onClick={() => setEditing(false)} className="text-sm font-semibold text-indigo-700">Cancel editing</button><QuestionForm existing={question} onCancel={() => setEditing(false)} /></div>
  const answers = getCommunityAnswers(question.id)
  const isOwner = question.authorId === COMMUNITY_USER_ID
  const action = (result: { ok: boolean; message: string }) => { setFeedback(result.message); setRefresh((value) => value + 1) }
  const vote = () => action(toggleCommunityVote('question', question.id))
  const removeQuestion = () => {
    if (!isOwner || !window.confirm('Delete this question and its answers?')) return
    const result = deleteCommunityQuestion(question.id)
    if (result.ok) navigate('/community/questions')
    else action(result)
  }
  const submitAnswer = () => {
    const result = createCommunityAnswer({ questionId: question.id, content: answer })
    if (!result.ok) setAnswerError(result.message)
    else { setAnswer(''); setAnswerError(''); action(result) }
  }
  const removeAnswer = (id: string) => {
    if (!window.confirm('Delete this answer?')) return
    action(deleteCommunityAnswer(id))
  }
  const acceptAnswer = (id: string) => action(setAcceptedCommunityAnswer(question.id, id))
  const saveAnswer = (id: string) => {
    const result = updateCommunityAnswer(id, answer)
    if (result.ok) { setEditingAnswer(null); setAnswer('') }
    action(result)
  }
  return <div className="mx-auto max-w-4xl space-y-6"><Link to="/community/questions" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-indigo-700"><Icon name="chevron-right" size={16} className="rotate-180" /> Back to questions</Link>{feedback && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>}<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600"><span>{question.category}</span>{question.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">#{tag}</span>)}</div><h1 className="mt-4 text-3xl font-bold text-slate-950">{question.title}</h1><p className="mt-5 whitespace-pre-wrap text-base leading-8 text-slate-700">{question.description}</p><div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500"><span>Asked by <strong className="text-slate-700">{question.authorName}</strong> · {new Date(question.createdAt).toLocaleDateString()}</span><div className="flex flex-wrap items-center gap-2"><ReactionButton contentType="question" contentId={question.id} /><button type="button" aria-pressed={hasCommunityVoted('question', question.id)} onClick={vote} className="min-h-10 rounded-lg bg-indigo-50 px-3 font-semibold text-indigo-700">{hasCommunityVoted('question', question.id) ? '▲ Voted' : '▲ Upvote'} · {getCommunityVoteCount('question', question.id)}</button>{isOwner && <><button type="button" onClick={() => setEditing(true)} className="min-h-10 rounded-lg px-3 font-semibold text-indigo-700 hover:bg-indigo-50">Edit</button><button type="button" onClick={removeQuestion} className="min-h-10 rounded-lg px-3 font-semibold text-rose-600 hover:bg-rose-50">Delete</button></>}</div></div><CommentsPanel contentType="question" contentId={question.id} /></section><section className="space-y-4"><h2 className="text-2xl font-bold text-slate-950">{answers.length} Answers</h2>{answers.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No answers yet. Be the first to help.</div>}{answers.map((item) => { const own = item.authorId === COMMUNITY_USER_ID; const accepted = question.acceptedAnswerId === item.id; return <article key={item.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${accepted ? 'border-emerald-300 ring-1 ring-emerald-100' : 'border-slate-200'}`}><div className="flex items-center justify-between gap-3">{accepted ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Accepted answer</span> : <span className="text-sm font-semibold text-slate-700">{item.authorName}</span>}<span className="text-xs text-slate-400">{new Date(item.updatedAt).toLocaleDateString()}</span></div>{editingAnswer === item.id ? <textarea aria-label="Edit answer" value={answer} onChange={(event) => setAnswer(event.target.value)} className="mt-4 min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm" /> : <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.content}</p>}<div className="mt-4 flex flex-wrap gap-2">{editingAnswer === item.id ? <><button type="button" onClick={() => saveAnswer(item.id)} className="min-h-10 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white">Save</button><button type="button" onClick={() => setEditingAnswer(null)} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold">Cancel</button></> : <><ReactionButton contentType="answer" contentId={item.id} /><button type="button" aria-pressed={hasCommunityVoted('answer', item.id)} onClick={() => action(toggleCommunityVote('answer', item.id))} className="min-h-10 rounded-lg bg-slate-100 px-3 text-sm font-semibold text-slate-700">{hasCommunityVoted('answer', item.id) ? '▲ Voted' : '▲ Upvote'} · {getCommunityVoteCount('answer', item.id)}</button>{own && <><button type="button" onClick={() => { setEditingAnswer(item.id); setAnswer(item.content) }} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-indigo-700">Edit</button><button type="button" onClick={() => removeAnswer(item.id)} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-rose-600">Delete</button></>}{isOwner && !accepted && <button type="button" onClick={() => acceptAnswer(item.id)} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-emerald-700">Accept answer</button>}</>}</div></article> })}</section><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-xl font-bold text-slate-950">Your answer</h2>{answerError && <p role="alert" className="mt-3 text-sm text-rose-600">{answerError}</p>}<textarea aria-label="Your answer" value={editingAnswer ? '' : answer} onChange={(event) => setAnswer(event.target.value)} className="mt-4 min-h-36 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Share a helpful solution..." /><button type="button" onClick={submitAnswer} className="mt-3 min-h-11 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Post answer</button></section></div>
}
