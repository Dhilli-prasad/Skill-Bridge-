import { Link } from 'react-router-dom'
import type { CommunityQuestion } from '../../../types/dashboard'
import { getCommunityAnswers, getCommunityVoteCount } from '../../../services/communityQuestionService'
import { getCommunityCommentCount } from '../../../services/communityInteractionService'
import { ReactionButton } from './ReactionButton'
import { DeveloperLink } from './DeveloperLink'

export function QuestionCard({ question }: { question: CommunityQuestion }) {
  const answers = getCommunityAnswers(question.id)
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600"><span>{question.category}</span>{question.acceptedAnswerId && <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Answered</span>}</div><h3 className="mt-2 text-xl font-bold text-slate-950"><Link to={`/community/questions/${question.id}`} className="hover:text-indigo-700">{question.title}</Link></h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{question.description}</p><div className="mt-4 flex flex-wrap gap-2">{question.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">#{tag}</span>)}</div><div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500"><DeveloperLink id={question.authorId} /><span>{new Date(question.createdAt).toLocaleDateString()}</span><ReactionButton contentType="question" contentId={question.id} /><span>{getCommunityVoteCount('question', question.id)} votes · {answers.length} answers · {getCommunityCommentCount('question', question.id)} comments</span></div></article>
}
