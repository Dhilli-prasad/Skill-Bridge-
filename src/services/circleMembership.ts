import { circleMemberProfiles, defaultCircleMemberProfiles } from '../data/mockData'
import type { CircleMember, CircleMemberRole, CircleMembership, LearningCircle } from '../types/dashboard'

export const DEMO_USER_ID = 'demo-user-aarav-kumar'
export const MEMBERSHIP_CHANGED_EVENT = 'skillbridge:membership-changed'

const STORAGE_KEY = 'skillbridge.circle-memberships'
const MEMBER_MANAGEMENT_KEY = 'skillbridge.circle-member-management'

function isMembership(value: unknown): value is CircleMembership {
  if (!value || typeof value !== 'object') {
    return false
  }

  const membership = value as Partial<CircleMembership>
  return typeof membership.userId === 'string'
    && typeof membership.circleId === 'string'
    && typeof membership.joinedAt === 'string'
}

function notifyMembershipChange() {
  window.dispatchEvent(new CustomEvent(MEMBERSHIP_CHANGED_EVENT))
}

function readStoredMemberships(): CircleMembership[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }

    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      console.warn('SkillBridge membership storage contains an invalid value.')
      return []
    }

    const seen = new Set<string>()
    return parsed.filter(isMembership).filter((membership) => {
      const key = `${membership.userId}:${membership.circleId}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  } catch (error) {
    console.warn('SkillBridge membership storage is unavailable or invalid.', error)
    return []
  }
}

export function getMemberships(userId = DEMO_USER_ID): CircleMembership[] {
  return readStoredMemberships().filter((membership) => membership.userId === userId)
}

function saveMemberships(memberships: CircleMembership[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memberships))
    notifyMembershipChange()
    return true
  } catch (error) {
    console.error('Unable to update SkillBridge membership storage.', error)
    return false
  }
}

interface MemberManagementRecord {
    circleId: string
    memberId: string
    role?: CircleMemberRole
    removed: boolean
  }

function isMemberManagementRecord(value: unknown): value is MemberManagementRecord {
    if (!value || typeof value !== 'object') return false
    const record = value as Partial<MemberManagementRecord>
    return typeof record.circleId === 'string'
      && typeof record.memberId === 'string'
      && (record.role === undefined || record.role === 'Owner' || record.role === 'Moderator' || record.role === 'Member')
      && typeof record.removed === 'boolean'
  }

function getManagementRecords(): MemberManagementRecord[] {
    try {
      const stored = window.localStorage.getItem(MEMBER_MANAGEMENT_KEY)
      if (!stored) return []
      const parsed: unknown = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed.filter(isMemberManagementRecord) : []
    } catch (error) {
      console.warn('SkillBridge member management storage is unavailable or invalid.', error)
      return []
    }
  }

function saveManagementRecords(records: MemberManagementRecord[]): boolean {
    try {
      window.localStorage.setItem(MEMBER_MANAGEMENT_KEY, JSON.stringify(records))
      notifyMembershipChange()
      return true
    } catch (error) {
      console.error('Unable to update SkillBridge member management storage.', error)
      return false
    }
  }

function canManageMembers(circle: LearningCircle): boolean {
    return circle.creator === 'Aarav Kumar'
  }

export function getCircleMembers(circle: LearningCircle): CircleMember[] {
    const management = getManagementRecords().filter((record) => record.circleId === circle.id)
    const membershipRecords = readStoredMemberships().filter((membership) => membership.circleId === circle.id)
    const owner: CircleMember = {
      id: `owner-${circle.id}`,
      name: circle.creator,
      bio: 'Learning community builder helping developers make steady progress together.',
      interests: [circle.category, circle.goal],
      circleId: circle.id,
      role: 'Owner',
      joinedAt: circle.createdAt,
    }
    const seededProfiles = circleMemberProfiles[circle.id] ?? defaultCircleMemberProfiles.map((profile) => ({ ...profile, id: `${profile.id}-${circle.id}` }))
    const seeded = seededProfiles.map((profile, index): CircleMember => {
      const override = management.find((record) => record.memberId === profile.id)
      return { ...profile, circleId: circle.id, role: override?.role ?? (index === 0 ? 'Moderator' : 'Member'), joinedAt: circle.createdAt }
    })
    const joined = membershipRecords.filter((membership) => membership.userId === DEMO_USER_ID && !seeded.some((member) => member.id === membership.userId)).map((membership): CircleMember => ({
      id: membership.userId,
      name: 'Aarav Kumar',
      bio: 'Developer building momentum through focused peer learning.',
      interests: [circle.category, 'Peer learning'],
      circleId: circle.id,
      role: 'Member',
      joinedAt: membership.joinedAt,
    }))
    const removedIds = new Set(management.filter((record) => record.removed).map((record) => record.memberId))
    return [owner, ...seeded, ...joined].filter((member) => !removedIds.has(member.id))
  }

  export function getCircleMemberCount(circle: LearningCircle, memberships = getMemberships()): number {
    const removedCount = getManagementRecords().filter((record) => record.circleId === circle.id && record.removed).length
    const membershipCount = memberships.filter((membership) => membership.circleId === circle.id).length
    return Math.max(1, circle.members + membershipCount - removedCount)
  }

export type MemberManagementResult = MembershipActionResult

export function updateMemberRole(circle: LearningCircle, memberId: string, role: CircleMemberRole): MemberManagementResult {
    if (!canManageMembers(circle)) return { ok: false, message: 'Only the circle owner can manage members in this demo.' }
    const member = getCircleMembers(circle).find((candidate) => candidate.id === memberId)
    if (!member || member.role === 'Owner' || role === 'Owner' || member.role === role) return { ok: false, message: 'That role transition is not available.' }
    const records = getManagementRecords().filter((record) => !(record.circleId === circle.id && record.memberId === memberId))
    return saveManagementRecords([...records, { circleId: circle.id, memberId, role, removed: false }])
      ? { ok: true, message: `${member.name} is now a ${role}.` }
      : { ok: false, message: 'We could not save this role change in local demo storage.' }
  }

export function removeCircleMember(circle: LearningCircle, memberId: string): MemberManagementResult {
    if (!canManageMembers(circle)) return { ok: false, message: 'Only the circle owner can manage members in this demo.' }
    const member = getCircleMembers(circle).find((candidate) => candidate.id === memberId)
    if (!member || member.role === 'Owner') return { ok: false, message: 'The circle owner cannot be removed.' }
    const records = getManagementRecords().filter((record) => !(record.circleId === circle.id && record.memberId === memberId))
    return saveManagementRecords([...records, { circleId: circle.id, memberId, removed: true }])
      ? { ok: true, message: `${member.name} was removed from the circle.` }
      : { ok: false, message: 'We could not remove this member from local demo storage.' }
}

export function isMember(circleId: string, memberships = getMemberships()): boolean {
  return memberships.some((membership) => membership.circleId === circleId)
}

export function getMemberCount(circle: LearningCircle, memberships = getMemberships()): number {
  return circle.members + (isMember(circle.id, memberships) ? 1 : 0)
}

export type MembershipActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string }

export function joinCircle(circle: LearningCircle): MembershipActionResult {
  const memberships = getMemberships()
  if (isMember(circle.id, memberships)) {
    return { ok: false, message: 'You are already a member of this circle.' }
  }
  if (getMemberCount(circle, memberships) >= circle.capacity) {
    return { ok: false, message: 'This circle is full. Try another learning circle.' }
  }

  const membership: CircleMembership = {
    userId: DEMO_USER_ID,
    circleId: circle.id,
    joinedAt: new Date().toISOString(),
  }
  return saveMemberships([...readStoredMemberships(), membership])
    ? { ok: true, message: `You joined ${circle.name}.` }
    : { ok: false, message: 'We could not save your membership in local demo storage.' }
}

export function leaveCircle(circle: LearningCircle): MembershipActionResult {
  const memberships = getMemberships()
  if (!isMember(circle.id, memberships)) {
    return { ok: false, message: 'You are not a member of this circle.' }
  }

  return saveMemberships(readStoredMemberships().filter((membership) => !(membership.userId === DEMO_USER_ID && membership.circleId === circle.id)))
    ? { ok: true, message: `You left ${circle.name}.` }
    : { ok: false, message: 'We could not update your membership in local demo storage.' }
}
