import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArticleContent } from '../components/ArticleContent'
import { ArticleCard } from '../components/ArticleCard'
import { useCommunityArticles } from '../../../hooks/useCommunityArticles'
import { COMMUNITY_USER_ID } from '../../../services/communityService'
import { canViewArticle, deleteCommunityArticle, getCommunityArticle } from '../../../services/communityArticleService'
import { Icon } from '../../../components/Icon'
import { CommentsPanel } from '../components/CommentsPanel'
import { ReactionButton } from '../components/ReactionButton'
import { DeveloperLink } from '../components/DeveloperLink'

export function ArticleReadingPage() {
  const { articleId } = useParams()
  const navigate = useNavigate()
  const articles = useCommunityArticles()
  const article = articleId ? getCommunityArticle(articleId) : undefined
  if (!article || !canViewArticle(article)) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-xl font-bold text-slate-950">This article is not available</h1><p className="mt-2 text-sm text-slate-500">Drafts are only visible to their author in this demo.</p><Link to="/community" className="mt-4 inline-block font-semibold text-indigo-700">Return to community</Link></div>
  const related = articles.filter((item) => item.id !== article.id && item.status === 'Published' && item.category === article.category).slice(0, 2)
  const isOwner = article.authorId === COMMUNITY_USER_ID
  const remove = () => {
    if (!isOwner || !window.confirm('Delete this article? This cannot be undone.')) return
    const result = deleteCommunityArticle(article.id)
    if (result.ok) navigate('/community')
  }
  return <article className="mx-auto max-w-4xl space-y-8"><header><Link to="/community" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-indigo-700"><Icon name="chevron-right" size={16} className="rotate-180" /> Back to community</Link><div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-600"><span>{article.category}</span>{article.status === 'Draft' && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Draft</span>}</div><h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">{article.title}</h1><p className="mt-4 text-xl leading-8 text-slate-500">{article.subtitle}</p><div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500"><DeveloperLink id={article.authorId} /> · {new Date(article.publishedAt ?? article.updatedAt).toLocaleDateString()}<ReactionButton contentType="article" contentId={article.id} />{isOwner && <><Link to={`/community/articles/${article.id}/edit`} className="rounded-lg bg-indigo-50 px-3 py-2 font-semibold text-indigo-700">Edit</Link><button type="button" onClick={remove} className="rounded-lg px-3 py-2 font-semibold text-rose-600 hover:bg-rose-50">Delete</button></>}</div></header>{article.coverImageUrl && <img src={article.coverImageUrl} alt="" className="max-h-[420px] w-full rounded-2xl object-cover" />}{!article.coverImageUrl && <div className="grid h-40 place-items-center rounded-2xl bg-gradient-to-br from-indigo-100 via-violet-100 to-slate-100 text-indigo-400"><Icon name="book-open" size={42} /></div>}<div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-10"><ArticleContent content={article.content} /></div><div className="flex flex-wrap gap-2">{article.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600">#{tag}</span>)}</div><CommentsPanel contentType="article" contentId={article.id} />{related.length > 0 && <section><h2 className="mb-4 text-2xl font-bold text-slate-950">Related articles</h2><div className="grid gap-4 md:grid-cols-2">{related.map((item) => <ArticleCard key={item.id} article={item} />)}</div></section>}</article>
}
