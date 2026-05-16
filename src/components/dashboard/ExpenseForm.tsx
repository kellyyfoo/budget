'use client'

import { useState, useRef, useEffect } from 'react'
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

const GAP = 8 // gap-2 = 8px

export default function ExpenseForm({ initial, year, month, categories, onSubmit, onCancel }: ExpenseFormProps) {
  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(initial?.amount !== undefined ? String(initial.amount) : '')
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : todayISO())
  const [category, setCategory] = useState<string>(initial?.category ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<UserCategory[][]>([categories])
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !measureRef.current) return
    const containerWidth = containerRef.current.clientWidth
    const pillEls = Array.from(measureRef.current.children) as HTMLElement[]
    const widths = pillEls.map(el => el.getBoundingClientRect().width)

    const newRows: UserCategory[][] = []
    let row: UserCategory[] = []
    let rowWidth = 0

    categories.forEach((cat, i) => {
      const w = widths[i]
      const needed = row.length > 0 ? GAP + w : w
      if (row.length > 0 && rowWidth + needed > containerWidth) {
        newRows.push(row)
        row = [cat]
        rowWidth = w
      } else {
        row.push(cat)
        rowWidth += needed
      }
    })
    if (row.length > 0) newRows.push(row)
    setRows(newRows)
  }, [categories])

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
        <div ref={containerRef} className="relative">
          {/* Hidden pills at px-5 for measuring expanded widths */}
          <div ref={measureRef} className="absolute invisible pointer-events-none flex gap-2" aria-hidden="true">
            {categories.map(cat => (
              <button key={cat.slug} className="px-5 py-1.5 rounded-full text-[9px] tracking-[0.1em] uppercase font-medium whitespace-nowrap">
                {cat.name}
              </button>
            ))}
          </div>
          {/* Pre-computed rows — each row is non-wrapping flex sized for px-5 pills */}
          <div className="space-y-2">
            {rows.map((row, ri) => (
              <div key={ri} className="flex gap-2">
                {row.map(cat => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setCategory(cat.slug)}
                    className={`px-3 py-1.5 rounded-full text-[9px] tracking-[0.1em] uppercase font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      category === cat.slug
                        ? 'px-5 bg-[#111111] text-[#FAFAF8] border border-[#111111]'
                        : 'border border-[#E5E5E0] text-[#999999] hover:px-5 hover:bg-[#111111] hover:text-[#FAFAF8] hover:border-[#111111]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
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
