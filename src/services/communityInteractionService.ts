import type { CommunityComment, CommunityContentType, CommunityReaction, CommunityReactionType } from '../types/dashboard'
import { COMMUNITY_CHANGED_EVENT, COMMUNITY_USER_ID } from './communityService'

const COMMENTS_KEY = 'skillbridge.community-comments'
const REACTIONS_KEY = 'skillbridge.community-reactions'

function isComment(value: unknown): value is CommunityComment {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CommunityComment>
  return typeof item.id === 'string' && typeof item.contentType === 'string' && typeof item.contentId === 'string'
    && typeof item.authorId === 'string' && typeof item.authorName === 'string' && typeof item.content === 'string'
    && typeof item.createdAt === 'string' && typeof item.updatedAt === 'string'
}

function read<T>(key: string, guard: (value: unknown) => value is T, label: string): T[] {
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

const comments = () => read(COMMENTS_KEY, isComment, 'comment')

function isReaction(value: unknown): value is CommunityReaction {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CommunityReaction>
  return typeof item.id === 'string' && typeof item.contentType === 'string' && typeof item.contentId === 'string'
    && ['post', 'article', 'question', 'answer', 'comment'].includes(item.contentType)
    && typeof item.userId === 'string' && item.type === 'like' && typeof item.createdAt === 'string'
}

function readReactions() {
  try {
    const stored = window.localStorage.getItem(REACTIONS_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.warn('SkillBridge reaction storage contains an invalid value.')
      return []
    }
    const parsedReactions = parsed.flatMap((value): CommunityReaction[] => {
      if (isReaction(value)) return [value]
      if (typeof value !== 'string') return []
      const parts = value.split(':')
      if (parts.length !== 3 || !['post', 'article', 'question', 'answer', 'comment'].includes(parts[0]) || !parts[1] || !parts[2]) return []
      return [{
        id: `legacy-reaction-${parts.join('-')}`,
        contentType: parts[0] as CommunityContentType,
        contentId: parts[1],
        userId: parts[2],
        type: 'like',
        createdAt: new Date(0).toISOString(),
      }]
    })
    const unique = new Map<string, CommunityReaction>()
    parsedReactions.forEach((reaction) => unique.set(`${reaction.contentType}:${reaction.contentId}:${reaction.userId}:${reaction.type}`, reaction))
    return [...unique.values()]
  } catch (error) {
    console.warn('SkillBridge reaction storage is unavailable or invalid.', error)
    return []
  }
}

export type InteractionResult = { ok: true; message: string; comment?: CommunityComment } | { ok: false; message: string }

export function getCommunityComments(contentType: CommunityContentType, contentId: string) {
  return comments().filter((comment) => comment.contentType === contentType && comment.contentId === contentId)
}

export function getAllCommunityComments() {
  return comments()
}

export function getCommunityCommentCount(contentType: CommunityContentType, contentId: string) {
  return getCommunityComments(contentType, contentId).length
}

export function createCommunityComment(contentType: CommunityContentType, contentId: string, content: string): InteractionResult {
  const value = content.trim()
  if (!value) return { ok: false, message: 'Comment cannot be empty.' }
  if (value.length > 2000) return { ok: false, message: 'Comments must be 2,000 characters or fewer.' }
  const now = new Date().toISOString()
  const comment: CommunityComment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    contentType,
    contentId,
    authorId: COMMUNITY_USER_ID,
    authorName: 'Aarav Kumar',
    content: value,
    createdAt: now,
    updatedAt: now,
  }
  return save(COMMENTS_KEY, [...comments(), comment], 'comment')
    ? { ok: true, message: 'Comment added.', comment }
    : { ok: false, message: 'We could not save your comment.' }
}

export function updateCommunityComment(id: string, content: string): InteractionResult {
  const existing = comments().find((comment) => comment.id === id)
  const value = content.trim()
  if (!existing || existing.authorId !== COMMUNITY_USER_ID) return { ok: false, message: 'Only your own comments can be edited.' }
  if (!value) return { ok: false, message: 'Comment cannot be empty.' }
  if (value.length > 2000) return { ok: false, message: 'Comments must be 2,000 characters or fewer.' }
  const updated = { ...existing, content: value, updatedAt: new Date().toISOString() }
  return save(COMMENTS_KEY, comments().map((comment) => comment.id === id ? updated : comment), 'comment')
    ? { ok: true, message: 'Comment updated.', comment: updated }
    : { ok: false, message: 'We could not update your comment.' }
}

export function deleteCommunityComment(id: string): InteractionResult {
  const existing = comments().find((comment) => comment.id === id)
  if (!existing || existing.authorId !== COMMUNITY_USER_ID) return { ok: false, message: 'Only your own comments can be deleted.' }
  return save(COMMENTS_KEY, comments().filter((comment) => comment.id !== id), 'comment')
    ? { ok: true, message: 'Comment deleted.' }
    : { ok: false, message: 'We could not delete your comment.' }
}

export function getCommunityReactionCount(contentType: CommunityContentType, contentId: string) {
  return readReactions().filter((reaction) => reaction.contentType === contentType && reaction.contentId === contentId && reaction.type === 'like').length
}

export function hasCommunityReaction(contentType: CommunityContentType, contentId: string) {
  return readReactions().some((reaction) => reaction.contentType === contentType && reaction.contentId === contentId && reaction.userId === COMMUNITY_USER_ID && reaction.type === 'like')
}

export function toggleCommunityReaction(contentType: CommunityContentType, contentId: string, type: CommunityReactionType = 'like'): InteractionResult {
  const all = readReactions()
  const existing = all.some((reaction) => reaction.contentType === contentType && reaction.contentId === contentId && reaction.userId === COMMUNITY_USER_ID && reaction.type === type)
  const next = existing
    ? all.filter((reaction) => !(reaction.contentType === contentType && reaction.contentId === contentId && reaction.userId === COMMUNITY_USER_ID && reaction.type === type))
    : [...all, { id: `reaction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, contentType, contentId, userId: COMMUNITY_USER_ID, type, createdAt: new Date().toISOString() }]
  return save(REACTIONS_KEY, next, 'reaction')
    ? { ok: true, message: existing ? 'Like removed.' : 'Liked.' }
    : { ok: false, message: 'We could not save your reaction.' }
}
