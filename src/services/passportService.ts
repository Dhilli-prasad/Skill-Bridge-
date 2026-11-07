import { COMMUNITY_CHANGED_EVENT, COMMUNITY_USER_ID } from './communityService'
import type { LearningDifficulty } from '../types/dashboard'

export type SkillProficiency = LearningDifficulty
export interface PassportSkill { name: string; proficiency: SkillProficiency; experience: string }
export interface PassportSettings {
  developerId: string
  headline: string
  publicProfile: boolean
  showLocation: boolean
  showLinks: boolean
  skills: PassportSkill[]
}

const KEY = 'skillbridge.passport-settings'
const isSettings = (value: unknown): value is PassportSettings => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<PassportSettings>
  return typeof item.developerId === 'string' && typeof item.headline === 'string' && typeof item.publicProfile === 'boolean'
    && typeof item.showLocation === 'boolean' && typeof item.showLinks === 'boolean' && Array.isArray(item.skills)
    && item.skills.every((skill) => Boolean(skill) && typeof skill === 'object' && typeof skill.name === 'string' && typeof skill.proficiency === 'string' && typeof skill.experience === 'string')
}
function read() {
  try {
    const stored = window.localStorage.getItem(KEY)
    const parsed: unknown = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed.filter(isSettings) : []
  } catch (error) {
    console.warn('SkillBridge passport storage is unavailable or invalid.', error)
    return []
  }
}
function save(settings: PassportSettings[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings))
    window.dispatchEvent(new CustomEvent(COMMUNITY_CHANGED_EVENT))
    return true
  } catch (error) {
    console.error('Unable to update SkillBridge passport storage.', error)
    return false
  }
}
export function getPassportSettings(developerId = COMMUNITY_USER_ID): PassportSettings {
  return read().find((item) => item.developerId === developerId) ?? { developerId, headline: '', publicProfile: true, showLocation: true, showLinks: true, skills: [] }
}
export function updatePassportSettings(settings: PassportSettings) {
  if (settings.developerId !== COMMUNITY_USER_ID) return { ok: false as const, message: 'Only the demo user can edit this passport.' }
  const skills = settings.skills.map((skill) => ({ ...skill, name: skill.name.trim(), experience: skill.experience.trim() })).filter((skill) => skill.name).slice(0, 20)
  if (settings.headline.trim().length > 120) return { ok: false as const, message: 'Headline must be 120 characters or fewer.' }
  if (skills.some((skill) => skill.name.length > 40 || skill.experience.length > 180)) return { ok: false as const, message: 'Keep skill names under 40 and experience under 180 characters.' }
  const unique = [...new Map(skills.map((skill) => [skill.name.toLowerCase(), skill])).values()]
  const updated = { ...settings, headline: settings.headline.trim(), skills: unique }
  return save([...read().filter((item) => item.developerId !== settings.developerId), updated]) ? { ok: true as const, message: 'Passport updated.' } : { ok: false as const, message: 'We could not save your passport.' }
}
