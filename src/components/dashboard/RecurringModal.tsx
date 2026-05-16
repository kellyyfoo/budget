'use client'

import { useState } from 'react'
import type { RecurringExpense, UserCategory, UserProfile } from '@/types'
import { getPalette } from '@/lib/categoryColors'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface RecurringModalProps {
  open: boolean
  onClose: () => void
  profile: UserProfile | null
  categories: UserCategory[]
  recurring: RecurringExpense[]
  onRecurringChange: (items: RecurringExpense[]) => void
  onRefresh: () => void
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default function RecurringModal({
  open,
  onClose,
  profile,
  categories,
  recurring,
  onRecurringChange,
  onRefresh,
}: RecurringModalProps) {
  const [netIncome, setNetIncome] = useState(String(profile?.default_net_income ?? 0))
  const [rent, setRent] = useState(String(profile?.default_rent ?? 0))
  const [savingsGoal, setSavingsGoal] = useState(String(profile?.default_savings_goal ?? 0))
  const [savingDefaults, setSavingDefaults] = useState(false)
  const [defaultsError, setDefaultsError] = useState('')
  const [defaultsSaved, setDefaultsSaved] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [newDesc, setNewDesc] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [addError, setAddError] = useState('')
  const [adding, setAdding] = useState(false)

  async function saveDefaults(e: React.FormEvent) {
    e.preventDefault()
    setSavingDefaults(true)
    setDefaultsError('')
    setDefaultsSaved(false)
    try {
      const res = await fetch('/api/recurring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          net_income: parseFloat(netIncome) || 0,
          rent: parseFloat(rent) || 0,
          savings_goal: parseFloat(savingsGoal) || 0,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setDefaultsError(err.error ?? 'Failed to save')
        return
      }
      setDefaultsSaved(true)
      setTimeout(() => setDefaultsSaved(false), 2000)
      onRefresh()
    } finally {
      setSavingDefaults(false)
    }
  }

  function startEdit(item: RecurringExpense) {
    setEditingId(item.id)
    setEditDesc(item.description)
    setEditAmount(String(item.amount))
    setEditCategory(item.category)
    setEditError('')
  }

  async function saveEdit(id: number) {
    setEditSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/api/recurring/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editDesc, amount: parseFloat(editAmount), category: editCategory }),
      })
      if (!res.ok) {
        const err = await res.json()
        setEditError(err.error ?? 'Failed to update')
        return
      }
      const updated = await res.json()
      onRecurringChange(recurring.map((r) => (r.id === id ? updated : r)))
      setEditingId(null)
    } finally {
      setEditSaving(false)
    }
  }

  async function deleteItem(id: number) {
    const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      onRecurringChange(recurring.filter((r) => r.id !== id))
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newDesc.trim() || !newCategory) return
    setAddError('')
    setAdding(true)
    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newDesc.trim(), amount: parseFloat(newAmount) || 0, category: newCategory }),
      })
      if (!res.ok) {
        const err = await res.json()
        setAddError(err.error ?? 'Failed to create')
        return
      }
      const created = await res.json()
      onRecurringChange([...recurring, created])
      onRefresh()
      setNewDesc('')
      setNewAmount('')
      setNewCategory('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Set Monthly Defaults">
      {/* Monthly Defaults */}
      <form onSubmit={saveDefaults} className="mb-8">
        <p className="text-[9px] tracking-[0.2em] uppercase text-[#111111] font-medium mb-5">Monthly Defaults</p>
        <div className="space-y-4">
          <Input
            label="Net Income"
            type="number"
            step="1"
            min="0"
            value={netIncome}
            onChange={(e) => setNetIncome(e.target.value)}
          />
          <Input
            label="Rent"
            type="number"
            step="1"
            min="0"
            value={rent}
            onChange={(e) => setRent(e.target.value)}
          />
          <Input
            label="Savings Goal"
            type="number"
            step="1"
            min="0"
            value={savingsGoal}
            onChange={(e) => setSavingsGoal(e.target.value)}
          />
        </div>
        {defaultsError && <p className="mt-3 text-[11px] text-red-500 tracking-wide">{defaultsError}</p>}
        <div className="mt-4 flex items-center gap-3">
          <Button type="submit" variant="primary" size="sm" loading={savingDefaults}>
            Save Defaults
          </Button>
          {defaultsSaved && (
            <span className="text-[10px] tracking-[0.1em] uppercase text-[#111111]">Saved</span>
          )}
        </div>
        <p className="mt-2 text-[10px] text-[#111111] opacity-50">Applied to new months only</p>
      </form>

      {/* Recurring Items */}
      <div className="border-t border-[#E5E5E0] pt-8">
        <p className="text-[9px] tracking-[0.2em] uppercase text-[#111111] font-medium mb-5">Recurring Items</p>

        <div className="space-y-1 mb-8">
          {recurring.length === 0 && (
            <p className="text-sm font-light text-[#111111] opacity-40 py-2">No recurring items yet.</p>
          )}
          {recurring.map((item) => {
            const cat = categories.find((c) => c.slug === item.category)
            const { badge } = cat ? getPalette(cat.color) : { badge: '' }

            if (editingId === item.id) {
              return (
                <div key={item.id} className="py-4 border-b border-[#E5E5E0] space-y-3">
                  <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} label="Description" />
                  <Input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} label="Amount" type="number" step="0.01" />
                  <CategoryPills categories={categories} value={editCategory} onChange={setEditCategory} />
                  {editError && <p className="text-[11px] text-red-500">{editError}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => saveEdit(item.id)} loading={editSaving}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              )
            }

            return (
              <div key={item.id} className="flex items-center justify-between py-3.5 border-b border-[#E5E5E0]">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-normal text-[#111111]">{item.description}</span>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] tracking-[0.1em] uppercase font-medium whitespace-nowrap ${badge}`}>
                      {cat?.name ?? item.category}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-[#111111]">{formatAmount(item.amount)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => startEdit(item)} className="text-[#CCCCCC] hover:text-[#111111] transition-colors cursor-pointer" aria-label="Edit">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="text-[#CCCCCC] hover:text-red-400 transition-colors cursor-pointer" aria-label="Delete">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add new */}
        <form onSubmit={handleAdd} className="space-y-4">
          <p className="text-[9px] tracking-[0.2em] uppercase text-[#111111] font-medium">Add Item</p>
          <Input
            label="Description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="e.g. Spotify"
            required
          />
          <Input
            label="Amount"
            type="number"
            step="0.01"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="0.00 (negative for income)"
            required
          />
          <CategoryPills categories={categories} value={newCategory} onChange={setNewCategory} />
          {addError && <p className="text-[11px] text-red-500 tracking-wide">{addError}</p>}
          <Button type="submit" variant="primary" size="sm" loading={adding}>
            Add
          </Button>
        </form>
      </div>
    </Modal>
  )
}

function CategoryPills({
  categories,
  value,
  onChange,
}: {
  categories: UserCategory[]
  value: string
  onChange: (slug: string) => void
}) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.18em] uppercase text-[#111111] font-medium mb-3">Category</label>
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => onChange(cat.slug)}
            className={`px-3 py-1 rounded-full text-[9px] tracking-[0.1em] uppercase font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
              value === cat.slug
                ? 'bg-[#111111] text-[#FAFAF8]'
                : 'border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#FAFAF8]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}
