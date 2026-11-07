import { Icon } from '../../../components/Icon'
import { circleCategories, circleDifficulties } from '../../../data/mockData'

interface CircleFiltersProps {
  search: string
  category: string
  difficulty: string
  sort: string
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onDifficultyChange: (value: string) => void
  onSortChange: (value: string) => void
  onClear: () => void
  hasFilters: boolean
}

export function CircleFilters({ search, category, difficulty, sort, onSearchChange, onCategoryChange, onDifficultyChange, onSortChange, onClear, hasFilters }: CircleFiltersProps) {
  return (
    <section aria-label="Filter learning circles" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row">
        <label className="relative min-w-0 flex-1"><span className="sr-only">Search circles by name or description</span><Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search circles by name or description..." className="min-h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label>
        <label className="min-w-0 flex-1 lg:max-w-xs"><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => onCategoryChange(event.target.value)} className="min-h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"><option value="">All categories</option>{circleCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="min-w-0 flex-1 lg:max-w-xs"><span className="sr-only">Filter by difficulty</span><select value={difficulty} onChange={(event) => onDifficultyChange(event.target.value)} className="min-h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"><option value="">All difficulty levels</option>{circleDifficulties.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="min-w-0 flex-1 lg:max-w-xs"><span className="sr-only">Sort circles</span><select value={sort} onChange={(event) => onSortChange(event.target.value)} className="min-h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"><option value="popular">Most popular</option><option value="newest">Newest</option></select></label>
        <button type="button" onClick={onClear} disabled={!hasFilters} className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40">Clear filters</button>
      </div>
    </section>
  )
}
