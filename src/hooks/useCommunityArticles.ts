import { useEffect, useState } from 'react'
import { COMMUNITY_CHANGED_EVENT } from '../services/communityService'
import { getCommunityArticles } from '../services/communityArticleService'
import type { CommunityArticle } from '../types/dashboard'

export function useCommunityArticles() {
  const [articles, setArticles] = useState<CommunityArticle[]>(() => getCommunityArticles())
  useEffect(() => {
    const refresh = () => setArticles(getCommunityArticles())
    window.addEventListener(COMMUNITY_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(COMMUNITY_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return articles
}
