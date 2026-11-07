import { useEffect, useState } from 'react'
import type { CommunityContentType } from '../../../types/dashboard'
import { COMMUNITY_CHANGED_EVENT } from '../../../services/communityService'
import { getCommunityReactionCount, hasCommunityReaction, toggleCommunityReaction } from '../../../services/communityInteractionService'
import { Icon } from '../../../components/Icon'

export function ReactionButton({ contentType, contentId }: { contentType: CommunityContentType; contentId: string }) {
  const [, refresh] = useState(0)
  const [error, setError] = useState('')
  useEffect(() => {
    const update = () => refresh((value) => value + 1)
    window.addEventListener(COMMUNITY_CHANGED_EVENT, update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener(COMMUNITY_CHANGED_EVENT, update)
      window.removeEventListener('storage', update)
    }
  }, [])
  const liked = hasCommunityReaction(contentType, contentId)
  const toggle = () => {
    const result = toggleCommunityReaction(contentType, contentId)
    setError(result.ok ? '' : result.message)
    if (result.ok) refresh((value) => value + 1)
  }
  return <span className="inline-flex flex-col items-start gap-1"><button type="button" aria-label={liked ? 'Unlike' : 'Like'} aria-pressed={liked} onClick={toggle} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold ${liked ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><Icon name="heart" size={15} />{getCommunityReactionCount(contentType, contentId)}</button>{error && <span role="alert" className="text-xs text-rose-600">{error}</span>}</span>
}
