import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { CirclesPage } from '../features/circles/pages/CirclesPage'
import { CreateCirclePage } from '../features/circles/pages/CreateCirclePage'
import { MyCirclesPage } from '../features/circles/pages/MyCirclesPage'
import { CommunityPage } from '../features/community/pages/CommunityPage'
import { ArticleEditorPage } from '../features/community/pages/ArticleEditorPage'
import { ArticleReadingPage } from '../features/community/pages/ArticleReadingPage'
import { QuestionsPage } from '../features/community/pages/QuestionsPage'
import { QuestionDetailPage } from '../features/community/pages/QuestionDetailPage'
import { QuestionForm } from '../features/community/components/QuestionForm'
import { DevelopersPage } from '../features/community/pages/DevelopersPage'
import { DeveloperProfilePage } from '../features/community/pages/DeveloperProfilePage'
import { LearningHubPage } from '../features/learning/pages/LearningHubPage'
import { LearningPathPage } from '../features/learning/pages/LearningPathPage'
import { LearningPathsPage } from '../features/learning/pages/LearningPathsPage'
import { LearningLessonPage } from '../features/learning/pages/LearningLessonPage'
import { LearningRoadmapsPage } from '../features/learning/pages/LearningRoadmapsPage'
import { LearningRoadmapPage } from '../features/learning/pages/LearningRoadmapPage'
import { LearningResourcesPage } from '../features/learning/pages/LearningResourcesPage'
import { LearningProgressPage } from '../features/learning/pages/LearningProgressPage'
import { ProjectsPage } from '../features/projects/pages/ProjectsPage'
import { ProjectDetailPage } from '../features/projects/pages/ProjectDetailPage'
import { ProjectFormPage } from '../features/projects/pages/ProjectFormPage'
import { DeveloperPassportIntegrationPage } from '../features/community/pages/DeveloperPassportIntegrationPage'
import { SkillExchangePage } from '../features/exchange/pages/SkillExchangePage'
import { CodeArenaPage } from '../features/code-arena/pages/CodeArenaPage'
import { SignInPage } from '../features/auth/pages/SignInPage'
import { SignUpPage } from '../features/auth/pages/SignUpPage'
import { VerifyEmailPage } from '../features/auth/pages/VerifyEmailPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { GuestOnlyRoute } from '../auth/GuestOnlyRoute'
import { ProfilePage } from '../features/profile/pages/ProfilePage'
import { isProfileApiEnabled } from '../services/profileApi'

const modulePages = [
  { path: '/community', title: 'Developer Community' },
  { path: '/learning', title: 'Learning Hub' },
  { path: '/code-arena', title: 'Code Arena' },
  { path: '/circles', title: 'Learning Circles' },
  { path: '/skill-exchange', title: 'Skill Exchange' },
  { path: '/projects', title: 'Project Collaboration' },
  { path: '/passport', title: 'Developer Passport' },
]

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Coming next</p>
        <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-3 text-slate-500">This module is ready for its feature-specific experience. The dashboard currently uses realistic mock data.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sign-in" element={<GuestOnlyRoute><SignInPage /></GuestOnlyRoute>} />
          <Route path="/sign-up" element={<GuestOnlyRoute><SignUpPage /></GuestOnlyRoute>} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute enabled={isProfileApiEnabled()} />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="/circles" element={<CirclesPage />} />
          <Route path="/circles/:circleId" element={<CirclesPage />} />
          <Route path="/circles/create" element={<CreateCirclePage />} />
          <Route path="/circles/my-circles" element={<MyCirclesPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/developers" element={<DevelopersPage />} />
          <Route path="/developers/:developerId" element={<DeveloperProfilePage />} />
          <Route element={<ProtectedRoute enabled={import.meta.env.VITE_DEVELOPER_PASSPORT_MODE === 'api'} />}>
            <Route path="/passport" element={<DeveloperPassportIntegrationPage />} />
            <Route path="/passport/:developerId" element={<DeveloperPassportIntegrationPage />} />
          </Route>
          <Route path="/skill-exchange" element={<SkillExchangePage />} />
          <Route path="/learning" element={<LearningHubPage />} />
          <Route path="/code-arena" element={<CodeArenaPage />} />
          <Route path="/learning/paths" element={<LearningPathsPage />} />
          <Route path="/learning/resources" element={<LearningResourcesPage />} />
          <Route path="/learning/progress" element={<LearningProgressPage />} />
          <Route path="/learning/roadmaps" element={<LearningRoadmapsPage />} />
          <Route path="/learning/roadmaps/:roadmapId" element={<LearningRoadmapPage />} />
          <Route element={<ProtectedRoute enabled={import.meta.env.VITE_PROJECT_COLLABORATION_MODE === 'api'} />}>
            <Route path="/projects/create" element={<ProjectFormPage />} />
            <Route path="/projects/:projectId/edit" element={<ProjectFormPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
          </Route>
          <Route path="/learning/:pathId" element={<LearningPathPage />} />
          <Route path="/learning/:pathId/lessons/:lessonId" element={<LearningLessonPage />} />
          <Route path="/community/questions" element={<QuestionsPage />} />
          <Route path="/community/questions/ask" element={<QuestionForm onCancel={() => window.history.back()} />} />
          <Route path="/community/questions/:questionId" element={<QuestionDetailPage />} />
          <Route path="/community/articles/create" element={<ArticleEditorPage />} />
          <Route path="/community/articles/:articleId/edit" element={<ArticleEditorPage />} />
          <Route path="/community/articles/:articleId" element={<ArticleReadingPage />} />
          {modulePages.filter((page) => !['/circles', '/community', '/learning', '/code-arena', '/projects', '/passport', '/skill-exchange'].includes(page.path)).map((page) => (
            <Route key={page.path} path={page.path} element={<PlaceholderPage title={page.title} />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
