import { useEffect, useState } from 'react'
import { DISCUSSIONS_CHANGED_EVENT, getCirclePosts } from '../services/discussionService'
import type { CircleDiscussionPost } from '../types/dashboard'

export function useCircleDiscussions(circleId: string) {
  const [posts, setPosts] = useState<CircleDiscussionPost[]>(() => getCirclePosts(circleId))
  useEffect(() => {
    const refresh = () => setPosts(getCirclePosts(circleId))
    window.addEventListener(DISCUSSIONS_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(DISCUSSIONS_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [circleId])
  return posts
}
