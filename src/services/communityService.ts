import { communityPosts } from '../data/communityMockData'
import type { CommunityPost, CreateCommunityPostInput } from '../types/dashboard'

export const COMMUNITY_CHANGED_EVENT = 'skillbridge:community-changed'
export const COMMUNITY_USER_ID = 'demo-user-aarav-kumar'
const POSTS_KEY = 'skillbridge.community-posts'
const LIKES_KEY = 'skillbridge.community-likes'
const BOOKMARKS_KEY = 'skillbridge.community-bookmarks'

function isPost(value: unknown): value is CommunityPost {
  if (!value || typeof value !== 'object') return false
  const post = value as Partial<CommunityPost>
  return typeof post.id === 'string' && typeof post.authorId === 'string' && typeof post.authorName === 'string'
    && typeof post.authorBio === 'string' && typeof post.title === 'string' && typeof post.content === 'string'
    && typeof post.category === 'string' && Array.isArray(post.tags) && post.tags.every((tag) => typeof tag === 'string')
    && typeof post.createdAt === 'string'
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
    window.dispatchEvent(new CustomEvent(COMMUNITY_CHANGED_EVENT))
    return true
  } catch (error) {
    console.error(`Unable to update SkillBridge ${label} storage.`, error)
    return false
  }
}

function storedPosts() {
  return readArray(POSTS_KEY, isPost, 'community post')
}

function storedKeys(key: string, label: string) {
  return readArray<string>(key, (value): value is string => typeof value === 'string', label)
}

export function getCommunityPosts() {
  const stored = storedPosts()
  const storedIds = new Set(stored.map((post) => post.id))
  return [...communityPosts.filter((post) => !storedIds.has(post.id)), ...stored]
}

export function getCommunityLikeCount(postId: string) {
  return storedKeys(LIKES_KEY, 'community likes').filter((key) => key.startsWith(`${postId}:`)).length
}

export function hasLikedCommunityPost(postId: string) {
  return storedKeys(LIKES_KEY, 'community likes').includes(`${postId}:${COMMUNITY_USER_ID}`)
}

export function isCommunityPostBookmarked(postId: string) {
  return storedKeys(BOOKMARKS_KEY, 'community bookmarks').includes(`${postId}:${COMMUNITY_USER_ID}`)
}

export type CommunityActionResult = { ok: true; message: string } | { ok: false; message: string }

export function createCommunityPost(input: CreateCommunityPostInput): CommunityActionResult {
  const title = input.title.trim()
  const content = input.content.trim()
  if (!title || !content) return { ok: false, message: 'Add a title and some content before publishing.' }
  if (title.length > 100) return { ok: false, message: 'Titles must be 100 characters or fewer.' }
  if (content.length > 2000) return { ok: false, message: 'Content must be 2,000 characters or fewer.' }
  const post: CommunityPost = {
    id: `community-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    authorId: COMMUNITY_USER_ID,
    authorName: 'Aarav Kumar',
    authorBio: 'Developer building momentum through focused peer learning.',
    title,
    content,
    category: input.category,
    tags: input.tags.filter(Boolean).slice(0, 5),
    createdAt: new Date().toISOString(),
  }
  return save(POSTS_KEY, [...storedPosts(), post], 'community post')
    ? { ok: true, message: 'Your post was published.' }
    : { ok: false, message: 'We could not save your post in local demo storage.' }
}

export function toggleCommunityLike(postId: string): CommunityActionResult {
  const likes = storedKeys(LIKES_KEY, 'community likes')
  const key = `${postId}:${COMMUNITY_USER_ID}`
  const next = likes.includes(key) ? likes.filter((item) => item !== key) : [...likes, key]
  return save(LIKES_KEY, next, 'community likes')
    ? { ok: true, message: likes.includes(key) ? 'Like removed.' : 'Post liked.' }
    : { ok: false, message: 'We could not save your like.' }
}

export function toggleCommunityBookmark(postId: string): CommunityActionResult {
  const bookmarks = storedKeys(BOOKMARKS_KEY, 'community bookmarks')
  const key = `${postId}:${COMMUNITY_USER_ID}`
  const next = bookmarks.includes(key) ? bookmarks.filter((item) => item !== key) : [...bookmarks, key]
  return save(BOOKMARKS_KEY, next, 'community bookmarks')
    ? { ok: true, message: bookmarks.includes(key) ? 'Bookmark removed.' : 'Post bookmarked.' }
    : { ok: false, message: 'We could not save your bookmark.' }
}
