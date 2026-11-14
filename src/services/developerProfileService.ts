import { developerProfiles } from '../data/developerProfileMockData'
import type { DeveloperProfile, UpdateDeveloperProfileInput } from '../types/dashboard'
import { COMMUNITY_CHANGED_EVENT, COMMUNITY_USER_ID } from './communityService'

const PROFILES_KEY = 'skillbridge.developer-profiles'
const FOLLOWS_KEY = 'skillbridge.developer-follows'

interface FollowRecord {
  id: string
  followerId: string
  followingId: string
  createdAt: string
}

const isProfile = (value: unknown): value is DeveloperProfile => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<DeveloperProfile>
  return typeof item.id === 'string' && typeof item.fullName === 'string' && typeof item.username === 'string'
    && typeof item.bio === 'string' && Array.isArray(item.skills) && item.skills.every((skill) => typeof skill === 'string')
    && Array.isArray(item.interests) && item.interests.every((interest) => typeof interest === 'string')
    && typeof item.joinedAt === 'string'
}

const isFollow = (value: unknown): value is FollowRecord => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<FollowRecord>
  return typeof item.id === 'string' && typeof item.followerId === 'string' && typeof item.followingId === 'string' && typeof item.createdAt === 'string'
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

function storedProfiles() { return read(PROFILES_KEY, isProfile, 'profile') }
function storedFollows() {
  const unique = new Map<string, FollowRecord>()
  read(FOLLOWS_KEY, isFollow, 'follow').forEach((item) => unique.set(`${item.followerId}:${item.followingId}`, item))
  return [...unique.values()]
}

export function getDeveloperProfiles() {
  const overrides = new Map(storedProfiles().map((profile) => [profile.id, profile]))
  return developerProfiles.map((profile) => overrides.get(profile.id) ?? profile)
}

export function getDeveloperProfile(id: string) {
  return getDeveloperProfiles().find((profile) => profile.id === id)
}

export function searchDeveloperProfiles(query: string) {
  const normalized = query.trim().toLowerCase()
  return getDeveloperProfiles().filter((profile) => !normalized || `${profile.fullName} ${profile.username} ${profile.skills.join(' ')}`.toLowerCase().includes(normalized))
}

export function updateDeveloperProfile(input: UpdateDeveloperProfileInput) {
  const fullName = input.fullName.trim()
  const username = input.username.trim().toLowerCase().replace(/^@/, '')
  const bio = input.bio.trim()
  const location = input.location.trim()
  const skills = input.skills.map((skill) => skill.trim()).filter(Boolean).slice(0, 12)
  const interests = input.interests.map((interest) => interest.trim()).filter(Boolean).slice(0, 8)
  if (!fullName || !username) return { ok: false as const, message: 'Name and username are required.' }
  if (fullName.length > 80 || username.length > 35 || bio.length > 280 || location.length > 80) return { ok: false as const, message: 'Please keep profile fields within their character limits.' }
  if (!/^[a-z0-9._-]+$/.test(username)) return { ok: false as const, message: 'Username may contain letters, numbers, dots, underscores, and hyphens.' }
  const current = getDeveloperProfile(COMMUNITY_USER_ID)
  if (!current) return { ok: false as const, message: 'Demo profile is unavailable.' }
  const portfolioUrl = input.portfolioUrl?.trim() || undefined
  const updated: DeveloperProfile = { ...current, fullName, username, bio, location: location || undefined, skills, interests, githubUrl: input.githubUrl.trim() || undefined, linkedinUrl: input.linkedinUrl.trim() || undefined, portfolioUrl, experienceLevel: input.experienceLevel ?? current.experienceLevel ?? 'Beginner' }
  const profiles = storedProfiles().filter((profile) => profile.id !== COMMUNITY_USER_ID)
  return save(PROFILES_KEY, [...profiles, updated], 'profile') ? { ok: true as const, message: 'Profile updated.', profile: updated } : { ok: false as const, message: 'We could not save your profile.' }
}

export function getFollowerCount(id: string) { return storedFollows().filter((follow) => follow.followingId === id).length }
export function getFollowingCount(id: string) { return storedFollows().filter((follow) => follow.followerId === id).length }
export function isFollowing(id: string) { return storedFollows().some((follow) => follow.followerId === COMMUNITY_USER_ID && follow.followingId === id) }
export function getFollowers(id: string) { return storedFollows().filter((follow) => follow.followingId === id).map((follow) => getDeveloperProfile(follow.followerId)).filter((profile): profile is DeveloperProfile => Boolean(profile)) }
export function getFollowing(id: string) { return storedFollows().filter((follow) => follow.followerId === id).map((follow) => getDeveloperProfile(follow.followingId)).filter((profile): profile is DeveloperProfile => Boolean(profile)) }

export function toggleFollowing(id: string) {
  if (id === COMMUNITY_USER_ID) return { ok: false as const, message: 'You cannot follow yourself.' }
  if (!getDeveloperProfile(id)) return { ok: false as const, message: 'Developer profile not found.' }
  const follows = storedFollows()
  const existing = follows.some((follow) => follow.followerId === COMMUNITY_USER_ID && follow.followingId === id)
  const next = existing
    ? follows.filter((follow) => !(follow.followerId === COMMUNITY_USER_ID && follow.followingId === id))
    : [...follows, { id: `follow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, followerId: COMMUNITY_USER_ID, followingId: id, createdAt: new Date().toISOString() }]
  return save(FOLLOWS_KEY, next, 'follow') ? { ok: true as const, message: existing ? 'Unfollowed.' : 'Following.' } : { ok: false as const, message: 'We could not update following.' }
}
