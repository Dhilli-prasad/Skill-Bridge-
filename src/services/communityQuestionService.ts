import { communityAnswers, communityQuestions } from '../data/communityQuestionMockData'
import type { CommunityAnswer, CommunityQuestion, CreateCommunityAnswerInput, CreateCommunityQuestionInput } from '../types/dashboard'
import { COMMUNITY_CHANGED_EVENT, COMMUNITY_USER_ID } from './communityService'

const QUESTIONS_KEY = 'skillbridge.community-questions'
const ANSWERS_KEY = 'skillbridge.community-answers'
const VOTES_KEY = 'skillbridge.community-question-votes'

function isQuestion(value: unknown): value is CommunityQuestion {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CommunityQuestion>
  return typeof item.id === 'string' && typeof item.authorId === 'string' && typeof item.authorName === 'string'
    && typeof item.title === 'string' && typeof item.description === 'string' && typeof item.category === 'string'
    && Array.isArray(item.tags) && item.tags.every((tag) => typeof tag === 'string')
    && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string'
    && (item.acceptedAnswerId === undefined || typeof item.acceptedAnswerId === 'string')
}

function isAnswer(value: unknown): value is CommunityAnswer {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CommunityAnswer>
  return typeof item.id === 'string' && typeof item.questionId === 'string' && typeof item.authorId === 'string'
    && typeof item.authorName === 'string' && typeof item.content === 'string'
    && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string'
}

function readArray<T>(key: string, guard: (value: unknown) => value is T, label: string): T[] {
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.warn(`SkillBridge ${label} storage contains an invalid value.`)
      return []
    }
    return parsed.filter(guard)
  } catch (error) {
    console.warn(`SkillBridge ${label} storage is unavailable or invalid.`, error)
    return []
  }
}

function save(key: string, value: unknown, label: string) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent(COMMUNITY_CHANGED_EVENT))
    return true
  } catch (error) {
    console.error(`Unable to update SkillBridge ${label} storage.`, error)
    return false
  }
}

function storedQuestions() {
  return readArray(QUESTIONS_KEY, isQuestion, 'question')
}

function storedAnswers() {
  return readArray(ANSWERS_KEY, isAnswer, 'answer')
}

function storedVotes() {
  return readArray<string>(VOTES_KEY, (value): value is string => typeof value === 'string', 'question votes')
}

export type QuestionActionResult = { ok: true; message: string; question?: CommunityQuestion; answer?: CommunityAnswer } | { ok: false; message: string }

export function getCommunityQuestions() {
  const stored = storedQuestions()
  const ids = new Set(stored.map((item) => item.id))
  return [...communityQuestions.filter((item) => !ids.has(item.id)), ...stored]
}

export function getCommunityQuestion(id: string) {
  return getCommunityQuestions().find((item) => item.id === id)
}

export function getCommunityAnswers(questionId: string) {
  const stored = storedAnswers()
  const ids = new Set(stored.map((item) => item.id))
  return [...communityAnswers.filter((item) => item.questionId === questionId && !ids.has(item.id)), ...stored.filter((item) => item.questionId === questionId)]
}

export function getCommunityVoteCount(type: 'question' | 'answer', id: string) {
  return storedVotes().filter((vote) => vote.startsWith(`${type}:${id}:`)).length
}

export function hasCommunityVoted(type: 'question' | 'answer', id: string) {
  return storedVotes().includes(`${type}:${id}:${COMMUNITY_USER_ID}`)
}

export function createCommunityQuestion(input: CreateCommunityQuestionInput): QuestionActionResult {
  const title = input.title.trim()
  const description = input.description.trim()
  if (!title || !description) return { ok: false, message: 'Add a question title and detailed description.' }
  if (title.length > 140) return { ok: false, message: 'Question titles must be 140 characters or fewer.' }
  if (description.length > 5000) return { ok: false, message: 'Descriptions must be 5,000 characters or fewer.' }
  const now = new Date().toISOString()
  const question: CommunityQuestion = {
    id: `question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    authorId: COMMUNITY_USER_ID,
    authorName: 'Aarav Kumar',
    title,
    description,
    category: input.category,
    tags: input.tags.filter(Boolean).slice(0, 8),
    createdAt: now,
    updatedAt: now,
  }
  return save(QUESTIONS_KEY, [...storedQuestions(), question], 'question')
    ? { ok: true, message: 'Your question was posted.', question }
    : { ok: false, message: 'We could not save your question in local demo storage.' }
}

export function updateCommunityQuestion(id: string, input: CreateCommunityQuestionInput): QuestionActionResult {
  const existing = storedQuestions().find((item) => item.id === id)
  if (!existing || existing.authorId !== COMMUNITY_USER_ID) return { ok: false, message: 'Only your own questions can be edited.' }
  const title = input.title.trim()
  const description = input.description.trim()
  if (!title || !description) return { ok: false, message: 'Add a question title and detailed description.' }
  const question = { ...existing, title, description, category: input.category, tags: input.tags.filter(Boolean).slice(0, 8), updatedAt: new Date().toISOString() }
  return save(QUESTIONS_KEY, storedQuestions().map((item) => item.id === id ? question : item), 'question')
    ? { ok: true, message: 'Your question was updated.', question }
    : { ok: false, message: 'We could not update this question.' }
}

export function deleteCommunityQuestion(id: string): QuestionActionResult {
  const existing = storedQuestions().find((item) => item.id === id)
  if (!existing || existing.authorId !== COMMUNITY_USER_ID) return { ok: false, message: 'Only your own questions can be deleted.' }
  const answerIds = new Set(storedAnswers().filter((answer) => answer.questionId === id).map((answer) => answer.id))
  const votes = storedVotes().filter((vote) => !vote.startsWith(`question:${id}:`) && ![...answerIds].some((answerId) => vote.startsWith(`answer:${answerId}:`)))
  const saved = save(QUESTIONS_KEY, storedQuestions().filter((item) => item.id !== id), 'question')
  if (saved) {
    save(ANSWERS_KEY, storedAnswers().filter((answer) => answer.questionId !== id), 'answer')
    save(VOTES_KEY, votes, 'question votes')
  }
  return saved ? { ok: true, message: 'Question deleted.' } : { ok: false, message: 'We could not delete this question.' }
}

export function createCommunityAnswer(input: CreateCommunityAnswerInput): QuestionActionResult {
  const content = input.content.trim()
  if (!getCommunityQuestion(input.questionId)) return { ok: false, message: 'This question is no longer available.' }
  if (!content) return { ok: false, message: 'Answer content cannot be empty.' }
  if (content.length > 5000) return { ok: false, message: 'Answers must be 5,000 characters or fewer.' }
  const now = new Date().toISOString()
  const answer: CommunityAnswer = { id: `answer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, questionId: input.questionId, authorId: COMMUNITY_USER_ID, authorName: 'Aarav Kumar', content, createdAt: now, updatedAt: now }
  return save(ANSWERS_KEY, [...storedAnswers(), answer], 'answer')
    ? { ok: true, message: 'Your answer was posted.', answer }
    : { ok: false, message: 'We could not save your answer.' }
}

export function updateCommunityAnswer(id: string, content: string): QuestionActionResult {
  const existing = storedAnswers().find((item) => item.id === id)
  if (!existing || existing.authorId !== COMMUNITY_USER_ID) return { ok: false, message: 'Only your own answers can be edited.' }
  if (!content.trim()) return { ok: false, message: 'Answer content cannot be empty.' }
  const answer = { ...existing, content: content.trim(), updatedAt: new Date().toISOString() }
  return save(ANSWERS_KEY, storedAnswers().map((item) => item.id === id ? answer : item), 'answer')
    ? { ok: true, message: 'Your answer was updated.', answer }
    : { ok: false, message: 'We could not update this answer.' }
}

export function deleteCommunityAnswer(id: string): QuestionActionResult {
  const existing = storedAnswers().find((item) => item.id === id)
  if (!existing || existing.authorId !== COMMUNITY_USER_ID) return { ok: false, message: 'Only your own answers can be deleted.' }
  const question = getCommunityQuestion(existing.questionId)
  if (question?.acceptedAnswerId === id) updateCommunityQuestion(question.id, { title: question.title, description: question.description, category: question.category, tags: question.tags })
  return save(ANSWERS_KEY, storedAnswers().filter((item) => item.id !== id), 'answer')
    ? { ok: true, message: 'Answer deleted.' }
    : { ok: false, message: 'We could not delete this answer.' }
}

export function setAcceptedCommunityAnswer(questionId: string, answerId: string): QuestionActionResult {
  const question = getCommunityQuestion(questionId)
  const answer = getCommunityAnswers(questionId).find((item) => item.id === answerId)
  if (!question || question.authorId !== COMMUNITY_USER_ID) return { ok: false, message: 'Only the question author can accept an answer.' }
  if (!answer) return { ok: false, message: 'This answer does not belong to the question.' }
  const stored = storedQuestions()
  const existing = stored.find((item) => item.id === questionId)
  if (!existing) return { ok: false, message: 'This demo question cannot be changed.' }
  const updated = { ...existing, acceptedAnswerId: answerId }
  return save(QUESTIONS_KEY, stored.map((item) => item.id === questionId ? updated : item), 'question')
    ? { ok: true, message: 'Answer marked as accepted.', question: updated }
    : { ok: false, message: 'We could not update the accepted answer.' }
}

export function toggleCommunityVote(type: 'question' | 'answer', id: string): QuestionActionResult {
  const votes = storedVotes()
  const key = `${type}:${id}:${COMMUNITY_USER_ID}`
  const next = votes.includes(key) ? votes.filter((vote) => vote !== key) : [...votes, key]
  return save(VOTES_KEY, next, 'question votes')
    ? { ok: true, message: votes.includes(key) ? 'Vote removed.' : 'Upvoted.' }
    : { ok: false, message: 'We could not save your vote.' }
}
