'use client'

import type { Expense, UserCategory } from '@/types'
import CategoryBadge from './CategoryBadge'

interface ExpenseRowProps {
  expense: Expense
  categories: UserCategory[]
  onEdit: (expense: Expense) => void
  onDelete: (id: number) => void
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' }).format(new Date(iso))
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default function ExpenseRow({ expense, categories, onEdit, onDelete }: ExpenseRowProps) {
  return (
    <tr className="group hover:bg-[#F5F5F0] transition-colors">
      <td className="py-3.5 pr-6 text-sm font-light text-[#111111] whitespace-nowrap w-20">
        {formatDate(expense.date)}
      </td>
      <td className="py-3.5 pr-6 text-sm font-normal text-[#111111]">
        {expense.description}
      </td>
      <td className="py-3.5 pr-6">
        <CategoryBadge category={expense.category} categories={categories} />
      </td>
      <td className="py-3.5 pr-6 text-sm font-semibold text-[#111111] text-right tabular-nums whitespace-nowrap">
        {formatAmount(expense.amount)}
      </td>
      <td className="py-3.5 text-right whitespace-nowrap w-16">
        <button
          onClick={() => onEdit(expense)}
          className="text-[#CCCCCC] hover:text-[#111111] hover:scale-110 transition-all duration-150 mr-3 cursor-pointer"
          aria-label="Edit expense"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          className="text-[#CCCCCC] hover:text-red-400 hover:scale-110 transition-all duration-150 cursor-pointer"
          aria-label="Delete expense"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      </td>
    </tr>
  )
}
