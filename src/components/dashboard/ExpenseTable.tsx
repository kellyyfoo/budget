'use client'

import type { Expense, UserCategory } from '@/types'
import ExpenseRow from './ExpenseRow'

interface ExpenseTableProps {
  expenses: Expense[]
  categories: UserCategory[]
  onEdit: (expense: Expense) => void
  onDelete: (id: number) => void
}

export default function ExpenseTable({ expenses, categories, onEdit, onDelete }: ExpenseTableProps) {
  if (expenses.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-light text-[#BBBBBB] tracking-wide">No expenses this month.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E5E5E0]">
            <th className="pb-3 pr-6 text-left text-[9px] tracking-[0.15em] uppercase text-[#111111] font-medium w-20">
              Date
            </th>
            <th className="pb-3 pr-6 text-left text-[9px] tracking-[0.15em] uppercase text-[#111111] font-medium">
              Description
            </th>
            <th className="pb-3 pr-6 text-left text-[9px] tracking-[0.15em] uppercase text-[#111111] font-medium">
              Category
            </th>
            <th className="pb-3 pr-6 text-right text-[9px] tracking-[0.15em] uppercase text-[#111111] font-medium">
              Amount
            </th>
            <th className="pb-3 w-16" />
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              categories={categories}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
