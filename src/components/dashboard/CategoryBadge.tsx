import { getPalette } from '@/lib/categoryColors'
import type { UserCategory } from '@/types'

interface CategoryBadgeProps {
  category: string
  categories: UserCategory[]
}

export default function CategoryBadge({ category, categories }: CategoryBadgeProps) {
  const cat = categories.find((c) => c.slug === category)
  const name = cat?.name ?? category
  const color = cat?.color ?? 'warm-gray'
  const { badge } = getPalette(color)

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] tracking-[0.1em] uppercase font-medium whitespace-nowrap ${badge}`}>
      {name}
    </span>
  )
}
