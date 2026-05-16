'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import DatePicker from '@/components/ui/DatePicker'
import type { Expense, UserCategory } from '@/types'

interface ExpenseFormProps {
  initial?: Partial<Expense>
  year: number
  month: number
  categories: UserCategory[]
  onSubmit: (data: Omit<Expense, 'id' | 'created_at'> & { year: number; month: number }) => Promise<void>
  onCancel: () => void
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ExpenseForm({ initial, year, month, categories, onSubmit, onCancel }: ExpenseFormProps) {
  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(initial?.amount !== undefined ? String(initial.amount) : '')
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : todayISO())
  const [category, setCategory] = useState<string>(initial?.category ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) { setError('Please select a category'); return }
    setError('')
    setLoading(true)
    try {
      await onSubmit({ description, amount: parseFloat(amount), date, category, year, month })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <Input
        label="Description"
        type="text"
        placeholder="e.g. Weekly groceries"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <Input
        label="Amount"
        type="number"
        placeholder="0.00 (negative for income)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        step="0.01"
        required
      />
      <DatePicker label="Date" value={date} onChange={setDate} />

      <div>
        <label className="block text-[10px] tracking-[0.18em] uppercase text-[#111111] font-medium mb-3">
          Category
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setCategory(cat.slug)}
              className={`px-3 py-1.5 rounded-full text-[9px] tracking-[0.1em] uppercase font-medium transition-all duration-400 cursor-pointer whitespace-nowrap ${
                category === cat.slug
                  ? 'bg-[#111111] text-[#FAFAF8] px-5'
                  : 'border border-[#E5E5E0] text-[#999999] hover:bg-[#111111] hover:text-[#FAFAF8] hover:border-[#111111] hover:px-5'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-[11px] text-red-500 tracking-wide">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" loading={loading} className="flex-1">
          {initial?.id ? 'Save Changes' : 'Add Expense'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}
