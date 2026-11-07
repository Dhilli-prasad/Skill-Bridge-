import { Link } from 'react-router-dom'
import type { CommunityArticle } from '../../../types/dashboard'
import { Icon } from '../../../components/Icon'
import { ReactionButton } from './ReactionButton'
import { getCommunityCommentCount } from '../../../services/communityInteractionService'
import { DeveloperLink } from './DeveloperLink'

export function ArticleCard({ article, onDelete }: { article: CommunityArticle; onDelete?: (article: CommunityArticle) => void }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">
            <span>{article.category}</span>
            {article.status === 'Draft' && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Draft</span>}
          </div>
          <h3 className="mt-2 text-xl font-bold text-slate-950">{article.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{article.subtitle}</p>
        </div>
        <Icon name="book-open" className="shrink-0 text-violet-500" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {article.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">#{tag}</span>)}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-2"><DeveloperLink id={article.authorId} /> · {new Date(article.publishedAt ?? article.updatedAt).toLocaleDateString()}</span>
        <div className="flex items-center gap-2">
          {article.status === 'Published' && <><ReactionButton contentType="article" contentId={article.id} /><span className="text-xs text-slate-500">{getCommunityCommentCount('article', article.id)} comments</span></>}
          <Link to={`/community/articles/${article.id}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-50 px-3 font-semibold text-indigo-700 hover:bg-indigo-100">
            Read article <Icon name="chevron-right" size={15} />
          </Link>
          {article.status === 'Draft' && onDelete && <button type="button" onClick={() => onDelete(article)} className="min-h-10 rounded-lg px-2 font-semibold text-rose-600 hover:bg-rose-50">Delete</button>}
        </div>
      </div>
    </article>
  )
}
