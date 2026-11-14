export interface NavItem {
  label: string
  path: string
  icon: string
}

export interface Stat {
  label: string
  value: string
  change: string
  icon: string
  tone: 'indigo' | 'violet' | 'emerald' | 'amber'
}

export type LearningDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export interface LearningPath {
  id: string
  title: string
  description: string
  difficulty: LearningDifficulty
  duration: string
  tags: string[]
  objectives: string[]
  prerequisites: string[]
  modules: LearningModule[]
  createdAt: string
}

export interface LearningModule {
  id: string
  title: string
  description: string
  lessons: LearningLesson[]
}

export interface LearningLesson {
  id: string
  title: string
  description: string
  material: string
  duration: string
}

export interface LearningEnrollment {
  pathId: string
  progress: number
  lastAccessedAt?: string
  completedAt?: string
  completedLessonIds: string[]
  completedLessonAt?: Record<string, string>
}

export interface LearningRoadmapMilestone {
  id: string
  title: string
  description: string
  topics: string[]
  duration: string
  relatedPathId?: string
  relatedLessonId?: string
}

export interface LearningRoadmap {
  id: string
  title: string
  description: string
  difficulty: LearningDifficulty
  duration: string
  milestones: LearningRoadmapMilestone[]
  createdAt: string
}

export interface LearningRoadmapProgress {
  roadmapId: string
  completedMilestoneIds: string[]
  lastAccessedAt?: string
  completedMilestoneAt?: Record<string, string>
}

export type LearningResourceType = 'Documentation' | 'Tutorials' | 'Videos' | 'Articles' | 'Practice Exercises' | 'Tools'

export interface LearningResource {
  id: string
  title: string
  description: string
  type: LearningResourceType
  tags: string[]
  difficulty: LearningDifficulty
  publisher: string
  url?: string
  duration: string
  createdAt: string
  relatedPathId?: string
}

export type ProjectStatus = 'Recruiting' | 'In Progress' | 'Completed'
export type ProjectRole = 'Owner' | 'Developer' | 'Designer' | 'Tester' | 'Contributor'

export interface CollaborationProject {
  id: string
  title: string
  description: string
  fullDescription: string
  goals: string[]
  outcomes: string[]
  ownerId: string
  technology: string[]
  category: string
  difficulty: LearningDifficulty
  requiredRoles: string[]
  memberIds: string[]
  capacity: number
  status: ProjectStatus
  createdAt: string
  repositoryUrl?: string
}

export type CircleDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'
export type CircleMemberRole = 'Owner' | 'Moderator' | 'Member'
export type CircleCategory = 'Web Development' | 'Python' | 'Java' | 'AWS and Cloud' | 'Artificial Intelligence' | 'Data Science' | 'Cybersecurity' | 'Mobile Development'

export interface LearningCircle {
  id: string
  name: string
  description: string
  category: CircleCategory
  difficulty: CircleDifficulty
  creator: string
  members: number
  capacity: number
  goal: string
  schedule: string
  duration: string
  createdAt: string
  progress: number
  featured: boolean
  objectives?: string[]
  meetingDays?: string[]
  meetingTime?: string
}

export interface CreateLearningCircleInput {
  name: string
  description: string
  category: CircleCategory
  difficulty: CircleDifficulty
  objectives: string[]
  capacity: number
  meetingDays: string[]
  meetingTime: string
  duration: string
}

export interface CircleMembership {
  userId: string
  circleId: string
  joinedAt: string
}

export interface CircleMemberProfile {
  id: string
  name: string
  bio: string
  interests: string[]
}

export interface CircleMember extends CircleMemberProfile {
  circleId: string
  role: CircleMemberRole
  joinedAt: string
}

export type TaskPriority = 'Low' | 'Medium' | 'High'
export type TaskStatus = 'Pending' | 'Completed' | 'Overdue'

export interface CircleTask {
  id: string
  circleId: string
  title: string
  description: string
  weekNumber: number
  dueDate: string
  priority: TaskPriority
  difficulty: CircleDifficulty
  assignedMemberId?: string
  completed: boolean
  completedAt?: string
  createdBy: string
  createdAt: string
}

export interface CreateCircleTaskInput {
  circleId: string
  title: string
  description: string
  weekNumber: number
  dueDate: string
  priority: TaskPriority
  difficulty: CircleDifficulty
  assignedMemberId?: string
}

export type DiscussionPostType = 'Discussion' | 'Question' | 'Announcement'

export interface CircleDiscussionPost {
  id: string
  circleId: string
  authorId: string
  authorName: string
  authorRole: CircleMemberRole
  title: string
  content: string
  type: DiscussionPostType
  createdAt: string
  pinned: boolean
}

export interface CircleDiscussionComment {
  id: string
  postId: string
  circleId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
  updatedAt?: string
}

export interface CreateDiscussionPostInput {
  circleId: string
  type: DiscussionPostType
  title: string
  content: string
}

export type CommunityCategory = 'Web Development' | 'JavaScript' | 'Python' | 'Java' | 'AWS and Cloud' | 'Artificial Intelligence' | 'Data Science' | 'Cybersecurity' | 'Open Source' | 'Career and Learning'

export interface CommunityPost {
  id: string
  authorId: string
  authorName: string
  authorBio: string
  title: string
  content: string
  category: CommunityCategory
  tags: string[]
  createdAt: string
}

export interface CreateCommunityPostInput {
  title: string
  content: string
  category: CommunityCategory
  tags: string[]
}

export type ArticleStatus = 'Draft' | 'Published'

export interface CommunityArticle {
  id: string
  authorId: string
  authorName: string
  authorBio: string
  title: string
  subtitle: string
  content: string
  category: CommunityCategory
  tags: string[]
  coverImageUrl?: string
  status: ArticleStatus
  createdAt: string
  updatedAt: string
  publishedAt?: string
  likeCount: number
}

export interface CreateCommunityArticleInput {
  title: string
  subtitle: string
  content: string
  category: CommunityCategory
  tags: string[]
  coverImageUrl?: string
  status: ArticleStatus
}

export interface CommunityQuestion {
  id: string
  authorId: string
  authorName: string
  title: string
  description: string
  category: CommunityCategory
  tags: string[]
  createdAt: string
  updatedAt: string
  acceptedAnswerId?: string
}

export interface CommunityAnswer {
  id: string
  questionId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface CreateCommunityQuestionInput {
  title: string
  description: string
  category: CommunityCategory
  tags: string[]
}

export interface CreateCommunityAnswerInput {
  questionId: string
  content: string
}

export type CommunityContentType = 'post' | 'article' | 'question' | 'answer' | 'comment'

export interface CommunityComment {
  id: string
  contentType: CommunityContentType
  contentId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
  updatedAt: string
}

export type CommunityReactionType = 'like'

export interface CommunityReaction {
  id: string
  contentType: CommunityContentType
  contentId: string
  userId: string
  type: CommunityReactionType
  createdAt: string
}

export interface DeveloperProfile {
  id: string
  fullName: string
  username: string
  bio: string
  location?: string
  skills: string[]
  interests: string[]
  githubUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  avatarUrl?: string
  joinedAt: string
}

export interface UpdateDeveloperProfileInput {
  fullName: string
  username: string
  bio: string
  location: string
  skills: string[]
  interests: string[]
  githubUrl: string
  linkedinUrl: string
  portfolioUrl?: string
  experienceLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
}
