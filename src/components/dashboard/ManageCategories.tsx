'use client'

import { useState } from 'react'
import type { UserCategory } from '@/types'
import { COLOR_KEYS, getPalette } from '@/lib/categoryColors'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface ManageCategoriesProps {
  open: boolean
  onClose: () => void
  categories: UserCategory[]
  onChange: (categories: UserCategory[]) => void
}

export default function ManageCategories({ open, onClose, categories, onChange }: ManageCategoriesProps) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editError, setEditError] = useState('')
  const [deleteErrors, setDeleteErrors] = useState<Record<number, string>>({})
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<string>(COLOR_KEYS[0])
  const [addError, setAddError] = useState('')
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)

  function startEdit(cat: UserCategory) {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
    setEditError('')
  }

  async function saveEdit(id: number) {
    if (!editName.trim()) return
    setSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      })
      if (!res.ok) {
        const err = await res.json()
        setEditError(err.error ?? 'Failed to update')
        return
      }
      const updated = await res.json()
      onChange(categories.map((c) => (c.id === id ? updated : c)))
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  async function deleteCategory(id: number) {
    setDeleteErrors((prev) => ({ ...prev, [id]: '' }))
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      onChange(categories.filter((c) => c.id !== id))
    } else {
      const data = await res.json()
      setDeleteErrors((prev) => ({ ...prev, [id]: data.error ?? 'Cannot delete' }))
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAddError('')
    setAdding(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      })
      if (!res.ok) {
        const err = await res.json()
        setAddError(err.error ?? 'Failed to create')
        return
      }
      const created = await res.json()
      onChange([...categories, created])
      setNewName('')
      setNewColor(COLOR_KEYS[0])
    } finally {
      setAdding(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Categories">
      <div className="space-y-1 mb-8">
        {categories.map((cat) => {
          const { dot } = getPalette(cat.color)
          if (editingId === cat.id) {
            return (
              <div key={cat.id} className="py-4 border-b border-[#E5E5E0]">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mb-4"
                />
                <ColorPicker value={editColor} onChange={setEditColor} />
                {editError && <p className="mt-2 text-[11px] text-red-500 tracking-wide">{editError}</p>}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="primary" onClick={() => saveEdit(cat.id)} loading={saving}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )
          }
          return (
            <div key={cat.id} className="flex items-start justify-between py-3.5 border-b border-[#E5E5E0]">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${dot}`} />
                <span className="text-sm font-light text-[#111111]">{cat.name}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                {deleteErrors[cat.id] && (
                  <span className="text-[10px] text-red-400 tracking-wide text-right max-w-[180px]">
                    {deleteErrors[cat.id]}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEdit(cat)}
                    className="text-[#CCCCCC] hover:text-[#111111] transition-colors cursor-pointer"
                    aria-label="Edit"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-[#CCCCCC] hover:text-red-400 transition-colors cursor-pointer"
                    aria-label="Delete"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-[#E5E5E0] pt-8">
        <p className="text-[9px] tracking-[0.2em] uppercase text-[#111111] font-medium mb-6">
          New Category
        </p>
        <form onSubmit={handleAdd} className="space-y-5">
          <Input
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Subscriptions"
            required
          />
          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-[#111111] font-medium mb-3">
              Color
            </label>
            <ColorPicker value={newColor} onChange={setNewColor} />
          </div>
          {addError && <p className="text-[11px] text-red-500 tracking-wide">{addError}</p>}
          <Button type="submit" variant="primary" size="sm" loading={adding}>
            Add Category
          </Button>
        </form>
      </div>
    </Modal>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {COLOR_KEYS.map((key) => {
        const { dot } = getPalette(key)
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`w-6 h-6 rounded-full flex-shrink-0 transition-all duration-200 cursor-pointer ${dot} ${
              value === key
                ? 'ring-2 ring-offset-2 ring-[#111111] scale-110'
                : 'hover:scale-110'
            }`}
            aria-label={key}
          />
        )
      })}
    </div>
  )
}
