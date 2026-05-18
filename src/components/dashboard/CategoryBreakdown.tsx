import type { Expense, UserCategory } from '@/types'
import { getPalette } from '@/lib/categoryColors'

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

interface CategoryBreakdownProps {
  expenses: Expense[]
  categories: UserCategory[]
  onManage: () => void
}

export default function CategoryBreakdown({ expenses, categories, onManage }: CategoryBreakdownProps) {
  if (expenses.length === 0) return null

  const totals = categories.map((cat) => ({
    cat,
    total: expenses.filter((e) => e.category === cat.slug).reduce((sum, e) => sum + e.amount, 0),
  })).filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)

  if (totals.length === 0) return null

  const maxTotal = totals[0].total

  return (
    <div className="px-10 py-6 border-b border-[#E5E5E0]">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[9px] tracking-[0.2em] uppercase text-[#111111] font-bold">By Category</p>
        <button
          onClick={onManage}
          className="text-[9px] tracking-[0.15em] uppercase text-[#111111] hover:opacity-60 transition-opacity cursor-pointer"
        >
          Manage
        </button>
      </div>
      <div className="space-y-2.5">
        {totals.map(({ cat, total }) => {
          const { dot } = getPalette(cat.color)
          const pct = (total / maxTotal) * 100
          const hex = dot.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? '#111111'
          return (
            <div key={cat.slug} className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                <span className="text-[9px] tracking-[0.15em] uppercase text-[#111111] font-medium truncate">
                  {cat.name}
                </span>
              </div>
              <div className="w-40 h-1.5 bg-[#E5E5E0] rounded-full overflow-hidden flex-shrink-0">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: hex }}
                />
              </div>
              <span className="text-[11px] tabular-nums text-[#111111] font-semibold w-14 text-right flex-shrink-0">
                {formatAmount(total)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
