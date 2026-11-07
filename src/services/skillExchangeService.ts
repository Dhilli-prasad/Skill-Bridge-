import { getDeveloperProfile } from './developerProfileService'
import { getPassportSettings } from './passportService'
import { COMMUNITY_CHANGED_EVENT, COMMUNITY_USER_ID } from './communityService'
import type { LearningDifficulty } from '../types/dashboard'

export type ExchangeType = 'Credit-based' | 'Direct Barter' | 'Both'
export type ListingAvailability = 'Available' | 'Paused'
export type ExchangeRequestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled' | 'Completed'

export interface SkillListing {
  id: string
  providerId: string
  skillName: string
  description: string
  proficiency: LearningDifficulty
  wantedSkills: string[]
  exchangeType: ExchangeType
  creditAmount?: number
  availability: ListingAvailability
  createdAt: string
}

export interface ExchangeRequest {
  id: string
  listingId: string
  providerId: string
  requesterId: string
  exchangeType: Exclude<ExchangeType, 'Both'>
  offeredSkillName: string
  requestedSkillName: string
  creditAmount?: number
  status: ExchangeRequestStatus
  createdAt: string
  requesterConfirmed?: boolean
  providerConfirmed?: boolean
  completedAt?: string
}

export interface CreditTransaction {
  id: string
  exchangeId: string
  userId: string
  amount: number
  type: 'earned' | 'spent'
  createdAt: string
}

const LISTINGS_KEY = 'skillbridge.skill-exchange-listings'
const REQUESTS_KEY = 'skillbridge.skill-exchange-requests'
const TRANSACTIONS_KEY = 'skillbridge.skill-exchange-transactions'
const seededListings: SkillListing[] = [
  { id: 'listing-maya-react', providerId: 'maya-patel', skillName: 'React accessibility', description: 'Pair with me to make component libraries more inclusive and easier to test.', proficiency: 'Advanced', wantedSkills: ['Testing', 'TypeScript'], exchangeType: 'Both', creditAmount: 18, availability: 'Available', createdAt: '2026-11-04T10:00:00.000Z' },
  { id: 'listing-arjun-python', providerId: 'arjun-mehta', skillName: 'Python automation', description: 'Learn practical scripts for repeatable developer workflows and small CLIs.', proficiency: 'Intermediate', wantedSkills: ['React', 'Git'], exchangeType: 'Direct Barter', availability: 'Available', createdAt: '2026-11-02T10:00:00.000Z' },
  { id: 'listing-priya-cloud', providerId: 'priya-shah', skillName: 'AWS foundations', description: 'Understand the building blocks of reliable, serverless cloud systems.', proficiency: 'Advanced', wantedSkills: ['TypeScript', 'Observability'], exchangeType: 'Credit-based', creditAmount: 25, availability: 'Available', createdAt: '2026-10-30T10:00:00.000Z' },
  { id: 'listing-rahul-java', providerId: 'rahul-nair', skillName: 'Spring Boot APIs', description: 'Review API structure, validation, and testing patterns in Spring Boot.', proficiency: 'Intermediate', wantedSkills: ['Python', 'Testing'], exchangeType: 'Both', creditAmount: 15, availability: 'Paused', createdAt: '2026-10-28T10:00:00.000Z' },
]

function read<T>(key: string, guard: (value: unknown) => value is T): T[] {
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter(guard) : []
  } catch (error) {
    console.warn('SkillBridge exchange storage is unavailable or invalid.', error)
    return []
  }
}
function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent(COMMUNITY_CHANGED_EVENT))
    return true
  } catch (error) {
    console.error('Unable to update SkillBridge exchange storage.', error)
    return false
  }
}
const isListing = (value: unknown): value is SkillListing => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<SkillListing>
  return typeof item.id === 'string' && typeof item.providerId === 'string' && typeof item.skillName === 'string' && typeof item.description === 'string' && ['Beginner', 'Intermediate', 'Advanced'].includes(item.proficiency ?? '') && Array.isArray(item.wantedSkills) && item.wantedSkills.every((skill) => typeof skill === 'string') && ['Credit-based', 'Direct Barter', 'Both'].includes(item.exchangeType ?? '') && (item.creditAmount === undefined || (Number.isInteger(item.creditAmount) && item.creditAmount > 0)) && ['Available', 'Paused'].includes(item.availability ?? '') && typeof item.createdAt === 'string'
}
const isRequest = (value: unknown): value is ExchangeRequest => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<ExchangeRequest>
  return typeof item.id === 'string' && typeof item.listingId === 'string' && typeof item.providerId === 'string' && typeof item.requesterId === 'string' && ['Credit-based', 'Direct Barter'].includes(item.exchangeType ?? '') && typeof item.offeredSkillName === 'string' && typeof item.requestedSkillName === 'string' && (item.creditAmount === undefined || Number.isInteger(item.creditAmount)) && ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'].includes(item.status ?? '') && typeof item.createdAt === 'string'
}
const isTransaction = (value: unknown): value is CreditTransaction => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CreditTransaction>
  return typeof item.id === 'string' && typeof item.exchangeId === 'string' && typeof item.userId === 'string' && Number.isInteger(item.amount) && item.amount !== undefined && item.amount > 0 && ['earned', 'spent'].includes(item.type ?? '') && typeof item.createdAt === 'string'
}
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const storedListings = () => read(LISTINGS_KEY, isListing)
const storedRequests = () => read(REQUESTS_KEY, isRequest)
const storedTransactions = () => read(TRANSACTIONS_KEY, isTransaction)

export function getSkillListings() {
  const stored = new Map(storedListings().map((item) => [item.id, item]))
  return [...seededListings.filter((item) => !stored.has(item.id)), ...storedListings()]
}
export function getSkillListing(idValue: string) { return getSkillListings().find((item) => item.id === idValue) }
export function getExchangeRequests() { return storedRequests() }
export function getCreditTransactions() { return storedTransactions() }
export function getCreditBalance(userId = COMMUNITY_USER_ID) {
  const transactions = storedTransactions().filter((item) => item.userId === userId)
  return 100 + transactions.reduce((balance, item) => balance + (item.type === 'earned' ? item.amount : -item.amount), 0)
}
export function getCreditSummary(userId = COMMUNITY_USER_ID) {
  const transactions = storedTransactions().filter((item) => item.userId === userId)
  return { balance: getCreditBalance(userId), earned: transactions.filter((item) => item.type === 'earned').reduce((sum, item) => sum + (item.amount ?? 0), 0), spent: transactions.filter((item) => item.type === 'spent').reduce((sum, item) => sum + (item.amount ?? 0), 0), transactions }
}
export function createSkillListing(input: Omit<SkillListing, 'id' | 'providerId' | 'createdAt'>) {
  const normalizedName = input.skillName.trim()
  if (!normalizedName || !input.description.trim() || !input.wantedSkills.length) return { ok: false as const, message: 'Skill name, description, and wanted skills are required.' }
  if ((input.exchangeType === 'Credit-based' || input.exchangeType === 'Both') && (!input.creditAmount || input.creditAmount < 1)) return { ok: false as const, message: 'Enter a positive credit amount for this exchange type.' }
  if (storedListings().some((item) => item.providerId === COMMUNITY_USER_ID && item.skillName.toLowerCase() === normalizedName.toLowerCase())) return { ok: false as const, message: 'You already have a listing for this skill.' }
  const listing: SkillListing = { ...input, id: id('listing'), providerId: COMMUNITY_USER_ID, skillName: normalizedName, description: input.description.trim(), wantedSkills: [...new Set(input.wantedSkills.map((skill) => skill.trim()).filter(Boolean))], createdAt: new Date().toISOString() }
  return save(LISTINGS_KEY, [...storedListings(), listing]) ? { ok: true as const, listing, message: 'Skill listing created.' } : { ok: false as const, message: 'We could not save the listing.' }
}
export function updateSkillListing(listingId: string, input: Omit<SkillListing, 'id' | 'providerId' | 'createdAt'>) {
  const current = getSkillListing(listingId)
  if (!current || current.providerId !== COMMUNITY_USER_ID) return { ok: false as const, message: 'Only your own listing can be edited.' }
  if (!input.skillName.trim() || !input.description.trim() || !input.wantedSkills.length) return { ok: false as const, message: 'Complete all required listing fields.' }
  if ((input.exchangeType === 'Credit-based' || input.exchangeType === 'Both') && (!input.creditAmount || input.creditAmount < 1)) return { ok: false as const, message: 'Enter a positive credit amount.' }
  const duplicate = getSkillListings().some((item) => item.id !== listingId && item.providerId === COMMUNITY_USER_ID && item.skillName.toLowerCase() === input.skillName.trim().toLowerCase())
  if (duplicate) return { ok: false as const, message: 'You already have a listing for this skill.' }
  const listing = { ...current, ...input, skillName: input.skillName.trim(), description: input.description.trim(), wantedSkills: input.wantedSkills.map((skill) => skill.trim()).filter(Boolean) }
  const records = storedListings().some((item) => item.id === listingId) ? storedListings().map((item) => item.id === listingId ? listing : item) : [...storedListings(), listing]
  return save(LISTINGS_KEY, records) ? { ok: true as const, message: 'Listing updated.' } : { ok: false as const, message: 'We could not update the listing.' }
}
export function deleteSkillListing(listingId: string) {
  const listing = getSkillListing(listingId)
  if (!listing || listing.providerId !== COMMUNITY_USER_ID) return { ok: false as const, message: 'Only your own listing can be deleted.' }
  if (storedRequests().some((request) => request.listingId === listingId && ['Pending', 'Accepted'].includes(request.status))) return { ok: false as const, message: 'Active exchange requests must be resolved first.' }
  return save(LISTINGS_KEY, [...storedListings().filter((item) => item.id !== listingId)]) ? { ok: true as const, message: 'Listing deleted.' } : { ok: false as const, message: 'We could not delete the listing.' }
}
export function requestExchange(listingId: string, exchangeType: Exclude<ExchangeType, 'Both'>, offeredSkillName?: string) {
  const listing = getSkillListing(listingId)
  if (!listing || listing.availability !== 'Available') return { ok: false as const, message: 'This listing is not currently available.' }
  if (listing.providerId === COMMUNITY_USER_ID) return { ok: false as const, message: 'You cannot request your own listing.' }
  if (listing.exchangeType !== exchangeType && listing.exchangeType !== 'Both') return { ok: false as const, message: 'That exchange method is not offered.' }
  if (storedRequests().some((request) => request.listingId === listingId && request.requesterId === COMMUNITY_USER_ID && ['Pending', 'Accepted'].includes(request.status))) return { ok: false as const, message: 'You already have an active request for this listing.' }
  const amount = exchangeType === 'Credit-based' ? listing.creditAmount : undefined
  if (amount === undefined && exchangeType === 'Credit-based') return { ok: false as const, message: 'This listing has no valid credit amount.' }
  if (amount && getCreditBalance() < amount) return { ok: false as const, message: `You need ${amount} credits, but your balance is ${getCreditBalance()}.` }
  if (exchangeType === 'Direct Barter' && !offeredSkillName?.trim()) return { ok: false as const, message: 'Select one of your skills to offer.' }
  const request: ExchangeRequest = { id: id('request'), listingId, providerId: listing.providerId, requesterId: COMMUNITY_USER_ID, exchangeType, offeredSkillName: offeredSkillName?.trim() ?? '', requestedSkillName: listing.skillName, creditAmount: amount, status: 'Pending', createdAt: new Date().toISOString() }
  return save(REQUESTS_KEY, [...storedRequests(), request]) ? { ok: true as const, message: 'Exchange request sent.' } : { ok: false as const, message: 'We could not send the request.' }
}
export function updateExchangeRequest(requestId: string, action: 'accept' | 'reject' | 'cancel') {
  const request = storedRequests().find((item) => item.id === requestId)
  if (!request || request.status !== 'Pending') return { ok: false as const, message: 'This request can no longer be changed.' }
  if (action === 'accept' && request.providerId !== COMMUNITY_USER_ID) return { ok: false as const, message: 'Only the provider can accept requests.' }
  if (action === 'reject' && request.providerId !== COMMUNITY_USER_ID) return { ok: false as const, message: 'Only the provider can reject requests.' }
  if (action === 'cancel' && request.requesterId !== COMMUNITY_USER_ID) return { ok: false as const, message: 'Only the requester can cancel requests.' }
  const status: ExchangeRequestStatus = action === 'accept' ? 'Accepted' : action === 'reject' ? 'Rejected' : 'Cancelled'
  return save(REQUESTS_KEY, storedRequests().map((item) => item.id === requestId ? { ...item, status } : item)) ? { ok: true as const, message: `Request ${status.toLowerCase()}.` } : { ok: false as const, message: 'We could not update the request.' }
}
export function confirmExchangeCompletion(requestId: string) {
  const request = storedRequests().find((item) => item.id === requestId)
  if (!request || request.status !== 'Accepted') return { ok: false as const, message: 'Only accepted exchanges can be completed.' }
  if (request.requesterId !== COMMUNITY_USER_ID && request.providerId !== COMMUNITY_USER_ID) return { ok: false as const, message: 'You are not part of this exchange.' }
  const next = { ...request, [request.requesterId === COMMUNITY_USER_ID ? 'requesterConfirmed' : 'providerConfirmed']: true }
  if (!next.requesterConfirmed || !next.providerConfirmed) return save(REQUESTS_KEY, storedRequests().map((item) => item.id === requestId ? next : item)) ? { ok: true as const, message: 'Your completion confirmation was recorded.' } : { ok: false as const, message: 'We could not record confirmation.' }
  const transactions = storedTransactions()
  if (request.exchangeType === 'Credit-based' && request.creditAmount && !transactions.some((item) => item.exchangeId === request.id)) {
    if (getCreditBalance(request.requesterId) < request.creditAmount) return { ok: false as const, message: 'The requester no longer has enough credits.' }
    transactions.push({ id: id('transaction'), exchangeId: request.id, userId: request.requesterId, amount: request.creditAmount, type: 'spent', createdAt: new Date().toISOString() }, { id: id('transaction'), exchangeId: request.id, userId: request.providerId, amount: request.creditAmount, type: 'earned', createdAt: new Date().toISOString() })
    if (!save(TRANSACTIONS_KEY, transactions)) return { ok: false as const, message: 'We could not process the credit transaction.' }
  }
  return save(REQUESTS_KEY, storedRequests().map((item) => item.id === requestId ? { ...next, status: 'Completed', completedAt: new Date().toISOString() } : item)) ? { ok: true as const, message: 'Exchange completed.' } : { ok: false as const, message: 'We could not complete the exchange.' }
}
export function getDemoUserSkills() {
  const profile = getDeveloperProfile(COMMUNITY_USER_ID)
  return [...new Set([...(profile?.skills ?? []), ...getPassportSettings(COMMUNITY_USER_ID).skills.map((skill) => skill.name), ...getSkillListings().filter((item) => item.providerId === COMMUNITY_USER_ID).map((item) => item.skillName)])]
}
