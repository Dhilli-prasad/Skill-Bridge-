export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'

export interface ProfileRecord {
  id: string
  fullName: string
  location: string
  bio: string
  skills: string[]
  experienceLevel: ExperienceLevel
  interests: string[]
  githubUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  photoUrl?: string | null
  updatedAt?: string
}

export type ProfileDraft = Omit<ProfileRecord, 'id' | 'photoUrl' | 'updatedAt'>
