import { useEffect, useState } from 'react'
import { COMMUNITY_CHANGED_EVENT, getCommunityPosts } from '../services/communityService'
import type { CommunityPost } from '../types/dashboard'

export function useCommunityPosts() {
  const [posts, setPosts] = useState<CommunityPost[]>(() => getCommunityPosts())
  useEffect(() => {
    const refresh = () => setPosts(getCommunityPosts())
    window.addEventListener(COMMUNITY_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(COMMUNITY_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])
  return posts
}
