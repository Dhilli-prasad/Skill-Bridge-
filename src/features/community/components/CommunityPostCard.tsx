import type { CommunityPost } from '../../../types/dashboard'
import { isCommunityPostBookmarked, toggleCommunityBookmark } from '../../../services/communityService'
import { Icon } from '../../../components/Icon'
import { ReactionButton } from './ReactionButton'
import { getCommunityCommentCount } from '../../../services/communityInteractionService'
import { DeveloperLink } from './DeveloperLink'

interface CommunityPostCardProps {
  post: CommunityPost
  onSelect: (post: CommunityPost) => void
  onFeedback: (message: string) => void
  onRefresh: () => void
}

export function CommunityPostCard({ post, onSelect, onFeedback, onRefresh }: CommunityPostCardProps) {
  const bookmarked = isCommunityPostBookmarked(post.id)
  const interact = (result: { message: string }) => {
    onFeedback(result.message)
    onRefresh()
  }
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
    <div className="flex items-start gap-3"><DeveloperLink id={post.authorId} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div><p className="mt-1 text-xs text-slate-500">{post.authorBio}</p></div></div>
    <div className="mt-4 flex flex-wrap items-center gap-2"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{post.category}</span>{post.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">#{tag}</span>)}</div>
    <h3 className="mt-4 text-lg font-bold text-slate-950">{post.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{post.content}</p>
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => onSelect(post)} className="min-h-10 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-200">View details</button><ReactionButton contentType="post" contentId={post.id} /><span className="text-xs text-slate-500">{getCommunityCommentCount('post', post.id)} comments</span><button type="button" aria-pressed={bookmarked} aria-label={bookmarked ? `Remove bookmark from ${post.title}` : `Bookmark ${post.title}`} onClick={() => interact(toggleCommunityBookmark(post.id))} className={`ml-auto flex min-h-10 min-w-10 items-center justify-center rounded-lg ${bookmarked ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}><Icon name="bookmark" size={16} /></button></div>
  </article>
}
