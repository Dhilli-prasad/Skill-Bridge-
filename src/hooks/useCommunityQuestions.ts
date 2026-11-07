import { useEffect, useState } from 'react'
import { COMMUNITY_CHANGED_EVENT } from '../services/communityService'
import { getCommunityQuestions } from '../services/communityQuestionService'
import type { CommunityQuestion } from '../types/dashboard'

export function useCommunityQuestions() {
  const [questions, setQuestions] = useState<CommunityQuestion[]>(() => getCommunityQuestions())
  useEffect(() => {
    const refresh = () => setQuestions(getCommunityQuestions())
    window.addEventListener(COMMUNITY_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(COMMUNITY_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return questions
}
