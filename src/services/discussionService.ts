import { demoDiscussionComments, demoDiscussionPosts } from '../data/discussionMockData'
import { DEMO_USER_ID, getCircleMembers, isMember } from './circleMembership'
import type {
  CircleDiscussionComment,
  CircleDiscussionPost,
  CircleMemberRole,
  CreateDiscussionPostInput,
  LearningCircle,
} from '../types/dashboard'

export const DISCUSSIONS_CHANGED_EVENT = 'skillbridge:discussions-changed'
const POSTS_KEY = 'skillbridge.circle-discussion-posts'
const COMMENTS_KEY = 'skillbridge.circle-discussion-comments'
const REACTIONS_KEY = 'skillbridge.circle-discussion-reactions'
const MAX_TITLE_LENGTH = 100
const MAX_CONTENT_LENGTH = 2000
const MAX_COMMENT_LENGTH = 500

function isPost(value: unknown): value is CircleDiscussionPost {
  if (!value || typeof value !== 'object') return false
  const post = value as Partial<CircleDiscussionPost>
  return typeof post.id === 'string' && typeof post.circleId === 'string' && typeof post.authorId === 'string'
    && typeof post.authorName === 'string' && (post.authorRole === 'Owner' || post.authorRole === 'Moderator' || post.authorRole === 'Member')
    && typeof post.title === 'string' && typeof post.content === 'string'
    && (post.type === 'Discussion' || post.type === 'Question' || post.type === 'Announcement')
    && typeof post.createdAt === 'string' && typeof post.pinned === 'boolean'
}

function isComment(value: unknown): value is CircleDiscussionComment {
  if (!value || typeof value !== 'object') return false
  const comment = value as Partial<CircleDiscussionComment>
  return typeof comment.id === 'string' && typeof comment.postId === 'string' && typeof comment.circleId === 'string'
    && typeof comment.authorId === 'string' && typeof comment.authorName === 'string'
    && typeof comment.content === 'string' && typeof comment.createdAt === 'string'
    && (comment.updatedAt === undefined || typeof comment.updatedAt === 'string')
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

function save(key: string, value: unknown, label: string): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent(DISCUSSIONS_CHANGED_EVENT))
    return true
  } catch (error) {
    console.error(`Unable to update SkillBridge ${label} storage.`, error)
    return false
  }
}

function storedPosts() {
  return readArray(POSTS_KEY, isPost, 'discussion post')
}

function storedComments() {
  return readArray(COMMENTS_KEY, isComment, 'discussion comment')
}

function isModerator(circle: LearningCircle) {
  return circle.creator === 'Aarav Kumar'
    || getCircleMembers(circle).some((member) => member.id === DEMO_USER_ID && (member.role === 'Owner' || member.role === 'Moderator'))
}

function canParticipate(circle: LearningCircle) {
  return circle.creator === 'Aarav Kumar' || isMember(circle.id)
}

function currentRole(circle: LearningCircle): CircleMemberRole {
  return getCircleMembers(circle).find((member) => member.id === DEMO_USER_ID)?.role ?? 'Member'
}

function unique<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>()
  return items.filter((item) => !seen.has(item.id) && seen.add(item.id))
}

export function getCirclePosts(circleId: string) {
  const stored = storedPosts().filter((post) => post.circleId === circleId)
  const storedIds = new Set(stored.map((post) => post.id))
  return unique([...demoDiscussionPosts.filter((post) => post.circleId === circleId && !storedIds.has(post.id)), ...stored])
}

export function getPostComments(postId: string) {
  const stored = storedComments().filter((comment) => comment.postId === postId)
  const storedIds = new Set(stored.map((comment) => comment.id))
  return unique([...demoDiscussionComments.filter((comment) => comment.postId === postId && !storedIds.has(comment.id)), ...stored])
}

export function getPostLikeCount(postId: string) {
  return readArray<string>(REACTIONS_KEY, (value): value is string => typeof value === 'string', 'discussion reaction')
    .filter((reaction) => reaction.startsWith(`${postId}:`)).length
}

export function hasLikedPost(postId: string) {
  return readArray<string>(REACTIONS_KEY, (value): value is string => typeof value === 'string', 'discussion reaction')
    .includes(`${postId}:${DEMO_USER_ID}`)
}

export type DiscussionActionResult = { ok: true; message: string } | { ok: false; message: string }

export function createDiscussionPost(circle: LearningCircle, input: CreateDiscussionPostInput): DiscussionActionResult {
  if (!canParticipate(circle)) return { ok: false, message: 'Join this circle before starting a discussion.' }
  if (!input.title.trim() || !input.content.trim()) return { ok: false, message: 'Add a title and content before publishing.' }
  if (input.title.trim().length > MAX_TITLE_LENGTH) return { ok: false, message: `Titles must be ${MAX_TITLE_LENGTH} characters or fewer.` }
  if (input.content.trim().length > MAX_CONTENT_LENGTH) return { ok: false, message: `Content must be ${MAX_CONTENT_LENGTH} characters or fewer.` }
  const post: CircleDiscussionPost = {
    id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    circleId: circle.id,
    authorId: DEMO_USER_ID,
    authorName: 'Aarav Kumar',
    authorRole: currentRole(circle),
    title: input.title.trim(),
    content: input.content.trim(),
    type: input.type,
    createdAt: new Date().toISOString(),
    pinned: false,
  }
  return save(POSTS_KEY, [...storedPosts(), post], 'discussion post')
    ? { ok: true, message: 'Your discussion was published.' }
    : { ok: false, message: 'We could not save your discussion in local demo storage.' }
}

export function updateDiscussionPost(circle: LearningCircle, postId: string, title: string, content: string): DiscussionActionResult {
  const post = getCirclePosts(circle.id).find((candidate) => candidate.id === postId)
  if (!post || post.authorId !== DEMO_USER_ID) return { ok: false, message: 'You can only edit your own discussions.' }
  if (!title.trim() || !content.trim()) return { ok: false, message: 'Add a title and content before saving.' }
  if (title.trim().length > MAX_TITLE_LENGTH || content.trim().length > MAX_CONTENT_LENGTH) return { ok: false, message: 'The title or content is too long.' }
  const updated = { ...post, title: title.trim(), content: content.trim() }
  const records = storedPosts()
  return save(POSTS_KEY, records.some((item) => item.id === postId) ? records.map((item) => item.id === postId ? updated : item) : [...records, updated], 'discussion post')
    ? { ok: true, message: 'Your discussion was updated.' }
    : { ok: false, message: 'We could not save this discussion.' }
}

export function deleteDiscussionPost(circle: LearningCircle, postId: string): DiscussionActionResult {
  const post = getCirclePosts(circle.id).find((candidate) => candidate.id === postId)
  if (!post || post.authorId !== DEMO_USER_ID) return { ok: false, message: 'You can only delete your own discussions.' }
  const comments = storedComments().filter((comment) => comment.postId !== postId)
  const reactions = readArray<string>(REACTIONS_KEY, (value): value is string => typeof value === 'string', 'discussion reaction').filter((reaction) => !reaction.startsWith(`${postId}:`))
  const postsSaved = save(POSTS_KEY, storedPosts().filter((item) => item.id !== postId), 'discussion post')
  const commentsSaved = save(COMMENTS_KEY, comments, 'discussion comment')
  const reactionsSaved = save(REACTIONS_KEY, reactions, 'discussion reaction')
  return postsSaved && commentsSaved && reactionsSaved ? { ok: true, message: 'Discussion deleted.' } : { ok: false, message: 'We could not delete this discussion.' }
}

export function addComment(circle: LearningCircle, postId: string, content: string): DiscussionActionResult {
  if (!canParticipate(circle)) return { ok: false, message: 'Join this circle before adding a comment.' }
  if (!getCirclePosts(circle.id).some((post) => post.id === postId)) return { ok: false, message: 'This discussion is no longer available.' }
  if (!content.trim()) return { ok: false, message: 'Write a comment before posting.' }
  if (content.trim().length > MAX_COMMENT_LENGTH) return { ok: false, message: `Comments must be ${MAX_COMMENT_LENGTH} characters or fewer.` }
  const comment: CircleDiscussionComment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    postId, circleId: circle.id, authorId: DEMO_USER_ID, authorName: 'Aarav Kumar',
    content: content.trim(), createdAt: new Date().toISOString(),
  }
  return save(COMMENTS_KEY, [...storedComments(), comment], 'discussion comment')
    ? { ok: true, message: 'Comment added.' }
    : { ok: false, message: 'We could not save this comment.' }
}

export function updateComment(circle: LearningCircle, commentId: string, content: string): DiscussionActionResult {
  const comment = getPostCommentsForCircle(circle.id).find((item) => item.id === commentId)
  if (!comment || comment.authorId !== DEMO_USER_ID) return { ok: false, message: 'You can only edit your own comments.' }
  if (!content.trim() || content.trim().length > MAX_COMMENT_LENGTH) return { ok: false, message: 'Enter a valid comment.' }
  const updated = { ...comment, content: content.trim(), updatedAt: new Date().toISOString() }
  return save(COMMENTS_KEY, storedComments().some((item) => item.id === commentId) ? storedComments().map((item) => item.id === commentId ? updated : item) : [...storedComments(), updated], 'discussion comment')
    ? { ok: true, message: 'Comment updated.' }
    : { ok: false, message: 'We could not save this comment.' }
}

function getPostCommentsForCircle(circleId: string) {
  return getCirclePosts(circleId).flatMap((post) => getPostComments(post.id))
}

export function deleteComment(circle: LearningCircle, commentId: string): DiscussionActionResult {
  const comment = getPostCommentsForCircle(circle.id).find((item) => item.id === commentId)
  if (!comment || comment.authorId !== DEMO_USER_ID) return { ok: false, message: 'You can only delete your own comments.' }
  return save(COMMENTS_KEY, storedComments().filter((item) => item.id !== commentId), 'discussion comment')
    ? { ok: true, message: 'Comment deleted.' }
    : { ok: false, message: 'We could not delete this comment.' }
}

export function togglePostLike(postId: string): DiscussionActionResult {
  const reactions = readArray<string>(REACTIONS_KEY, (value): value is string => typeof value === 'string', 'discussion reaction')
  const reaction = `${postId}:${DEMO_USER_ID}`
  const next = reactions.includes(reaction) ? reactions.filter((item) => item !== reaction) : [...reactions, reaction]
  return save(REACTIONS_KEY, next, 'discussion reaction')
    ? { ok: true, message: reactions.includes(reaction) ? 'Like removed.' : 'Discussion liked.' }
    : { ok: false, message: 'We could not save your reaction.' }
}

export function setPostPinned(circle: LearningCircle, postId: string, pinned: boolean): DiscussionActionResult {
  if (!isModerator(circle)) return { ok: false, message: 'Only the owner or a moderator can pin discussions in this demo.' }
  const post = getCirclePosts(circle.id).find((candidate) => candidate.id === postId)
  if (!post) return { ok: false, message: 'This discussion is no longer available.' }
  const updated = { ...post, pinned }
  const records = storedPosts()
  return save(POSTS_KEY, records.some((item) => item.id === postId) ? records.map((item) => item.id === postId ? updated : item) : [...records, updated], 'discussion post')
    ? { ok: true, message: pinned ? 'Discussion pinned.' : 'Discussion unpinned.' }
    : { ok: false, message: 'We could not save this pin change.' }
}

export function removeDiscussionPost(circle: LearningCircle, postId: string): DiscussionActionResult {
  if (!isModerator(circle)) return { ok: false, message: 'Only the owner or a moderator can remove discussions in this demo.' }
  const post = getCirclePosts(circle.id).find((candidate) => candidate.id === postId)
  if (!post) return { ok: false, message: 'This discussion is no longer available.' }
  const commentsSaved = save(COMMENTS_KEY, storedComments().filter((comment) => comment.postId !== postId), 'discussion comment')
  const reactionsSaved = save(
    REACTIONS_KEY,
    readArray<string>(REACTIONS_KEY, (value): value is string => typeof value === 'string', 'discussion reaction')
      .filter((reaction) => !reaction.startsWith(`${postId}:`)),
    'discussion reaction',
  )
  const postSaved = save(POSTS_KEY, storedPosts().filter((item) => item.id !== postId), 'discussion post')
  return commentsSaved && reactionsSaved && postSaved
    ? { ok: true, message: 'Discussion removed.' }
    : { ok: false, message: 'We could not remove this discussion and its related records.' }
}

export { MAX_COMMENT_LENGTH, MAX_CONTENT_LENGTH, MAX_TITLE_LENGTH }
