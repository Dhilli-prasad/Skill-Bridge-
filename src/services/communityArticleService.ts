import { communityArticles } from '../data/communityArticleMockData'
import type { CommunityArticle, CreateCommunityArticleInput } from '../types/dashboard'
import { COMMUNITY_CHANGED_EVENT, COMMUNITY_USER_ID } from './communityService'

const ARTICLES_KEY = 'skillbridge.community-articles'

function isArticle(value: unknown): value is CommunityArticle {
  if (!value || typeof value !== 'object') return false
  const article = value as Partial<CommunityArticle>
  return typeof article.id === 'string' && typeof article.authorId === 'string'
    && typeof article.authorName === 'string' && typeof article.authorBio === 'string'
    && typeof article.title === 'string' && typeof article.subtitle === 'string'
    && typeof article.content === 'string' && typeof article.category === 'string'
    && Array.isArray(article.tags) && article.tags.every((tag) => typeof tag === 'string')
    && (article.status === 'Draft' || article.status === 'Published')
    && typeof article.createdAt === 'string' && typeof article.updatedAt === 'string'
    && typeof article.likeCount === 'number'
}

function readArticles() {
  try {
    const stored = window.localStorage.getItem(ARTICLES_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.warn('SkillBridge article storage contains an invalid value.')
      return []
    }
    return parsed.filter(isArticle)
  } catch (error) {
    console.warn('SkillBridge article storage is unavailable or invalid.', error)
    return []
  }
}

function saveArticles(articles: CommunityArticle[]) {
  try {
    window.localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles))
    window.dispatchEvent(new CustomEvent(COMMUNITY_CHANGED_EVENT))
    return true
  } catch (error) {
    console.error('Unable to update SkillBridge article storage.', error)
    return false
  }
}

export type ArticleActionResult = { ok: true; message: string; article?: CommunityArticle } | { ok: false; message: string }

export function getCommunityArticles() {
  const stored = readArticles()
  const storedIds = new Set(stored.map((article) => article.id))
  return [...communityArticles.filter((article) => !storedIds.has(article.id)), ...stored]
}

export function getCommunityArticle(id: string) {
  return getCommunityArticles().find((article) => article.id === id)
}

export function canViewArticle(article: CommunityArticle) {
  return article.status === 'Published' || article.authorId === COMMUNITY_USER_ID
}

export function createCommunityArticle(input: CreateCommunityArticleInput): ArticleActionResult {
  const title = input.title.trim()
  const subtitle = input.subtitle.trim()
  const content = input.content.trim()
  if (!title || !content) return { ok: false, message: 'Add an article title and content.' }
  if (title.length > 120) return { ok: false, message: 'Titles must be 120 characters or fewer.' }
  if (subtitle.length > 240) return { ok: false, message: 'Subtitles must be 240 characters or fewer.' }
  if (content.length > 20000) return { ok: false, message: 'Article content must be 20,000 characters or fewer.' }
  const now = new Date().toISOString()
  const article: CommunityArticle = {
    id: `article-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    authorId: COMMUNITY_USER_ID,
    authorName: 'Aarav Kumar',
    authorBio: 'Developer building momentum through focused peer learning.',
    title,
    subtitle,
    content,
    category: input.category,
    tags: input.tags.filter(Boolean).slice(0, 8),
    coverImageUrl: input.coverImageUrl?.trim() || undefined,
    status: input.status,
    createdAt: now,
    updatedAt: now,
    publishedAt: input.status === 'Published' ? now : undefined,
    likeCount: 0,
  }
  return saveArticles([...readArticles(), article])
    ? { ok: true, message: input.status === 'Published' ? 'Your article was published.' : 'Your article was saved as a draft.', article }
    : { ok: false, message: 'We could not save your article in local demo storage.' }
}

export function updateCommunityArticle(id: string, input: CreateCommunityArticleInput): ArticleActionResult {
  const existing = readArticles().find((article) => article.id === id)
  if (!existing || existing.authorId !== COMMUNITY_USER_ID) return { ok: false, message: 'Only your own articles can be edited.' }
  const title = input.title.trim()
  const content = input.content.trim()
  if (!title || !content) return { ok: false, message: 'Add an article title and content.' }
  const now = new Date().toISOString()
  const article: CommunityArticle = {
    ...existing,
    title,
    subtitle: input.subtitle.trim(),
    content,
    category: input.category,
    tags: input.tags.filter(Boolean).slice(0, 8),
    coverImageUrl: input.coverImageUrl?.trim() || undefined,
    status: input.status,
    updatedAt: now,
    publishedAt: input.status === 'Published' ? (existing.publishedAt ?? now) : undefined,
  }
  return saveArticles(readArticles().map((item) => item.id === id ? article : item))
    ? { ok: true, message: input.status === 'Published' ? 'Your article was updated and published.' : 'Your draft was updated.', article }
    : { ok: false, message: 'We could not update this article in local demo storage.' }
}

export function deleteCommunityArticle(id: string): ArticleActionResult {
  const existing = readArticles().find((article) => article.id === id)
  if (!existing || existing.authorId !== COMMUNITY_USER_ID) return { ok: false, message: 'Only your own articles can be deleted.' }
  return saveArticles(readArticles().filter((article) => article.id !== id))
    ? { ok: true, message: 'Article deleted.' }
    : { ok: false, message: 'We could not delete this article from local demo storage.' }
}
