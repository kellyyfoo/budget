'use client'

import { useState, useRef } from 'react'
import type { BudgetMonthData } from '@/types'

interface BudgetSummaryProps {
  budgetMonth: BudgetMonthData
  expensesTotal: number
  onUpdate: (field: 'net_income' | 'rent' | 'savings_goal', value: number) => Promise<void>
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function EditableAmount({
  label,
  value,
  onSave,
  hero,
}: {
  label: string
  value: number
  onSave: (v: number) => Promise<void>
  hero?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setRaw(String(value))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function commit() {
    const parsed = parseFloat(raw)
    if (!isNaN(parsed) && parsed >= 0) {
      await onSave(parsed)
    }
    setEditing(false)
  }

  const amountClass = hero ? 'text-3xl font-bold' : 'text-2xl font-normal'
  const labelClass = hero ? 'text-[10px]' : 'text-[9px]'

  return (
    <div className="flex flex-col gap-2">
      <span className={`${labelClass} tracking-[0.2em] uppercase text-[#111111] font-semibold`}>{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          className={`${amountClass} tabular-nums text-[#111111] bg-transparent border-b border-[#111111] outline-none w-32 py-0.5`}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          type="number"
          min="0"
          step="1"
        />
      ) : (
        <button
          onClick={startEdit}
          className={`${amountClass} tabular-nums text-[#111111] text-left hover:opacity-60 transition-opacity cursor-text`}
        >
          {formatCurrency(value)}
        </button>
      )}
    </div>
  )
}

function SavingsAmount({
  savingsGoal,
  actualSavings,
  onSave,
}: {
  savingsGoal: number
  actualSavings: number
  onSave: (v: number) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setRaw(String(savingsGoal))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function commit() {
    const parsed = parseFloat(raw)
    if (!isNaN(parsed) && parsed >= 0) {
      await onSave(parsed)
    }
    setEditing(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[9px] tracking-[0.2em] uppercase text-[#111111] font-semibold">
        Savings{savingsGoal > 0 && (
          <span className="normal-case tracking-normal font-normal"> (goal: {formatCurrency(savingsGoal)})</span>
        )}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          className="text-2xl font-normal tabular-nums text-[#111111] bg-transparent border-b border-[#111111] outline-none w-32 py-0.5"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          type="number"
          min="0"
          step="1"
        />
      ) : (
        <button
          onClick={startEdit}
          className="text-2xl font-normal tabular-nums text-[#111111] text-left hover:opacity-60 transition-opacity cursor-text"
        >
          {formatCurrency(actualSavings)}
        </button>
      )}
    </div>
  )
}

export default function BudgetSummary({ budgetMonth, expensesTotal, onUpdate }: BudgetSummaryProps) {
  const remaining = budgetMonth.net_income - budgetMonth.rent - expensesTotal - budgetMonth.savings_goal
  const actualSavings = budgetMonth.savings_goal + Math.min(0, remaining)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 py-8 px-10 border-b border-[#E5E5E0]">
      <EditableAmount
        label="Net Income"
        value={budgetMonth.net_income}
        onSave={(v) => onUpdate('net_income', v)}
        hero
      />
      <EditableAmount
        label="Rent"
        value={budgetMonth.rent}
        onSave={(v) => onUpdate('rent', v)}
      />
      <SavingsAmount
        savingsGoal={budgetMonth.savings_goal}
        actualSavings={actualSavings}
        onSave={(v) => onUpdate('savings_goal', v)}
      />
      <div className="flex flex-col gap-2">
        <span className="text-[9px] tracking-[0.2em] uppercase text-[#111111] font-semibold">Other Expenses</span>
        <span className="text-2xl font-normal tabular-nums text-[#111111]">{formatCurrency(expensesTotal)}</span>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[9px] tracking-[0.2em] uppercase text-[#111111] font-semibold">Remaining</span>
        <div className={`self-start inline-flex items-center rounded-full px-3 py-0.5 ${remaining < 0 ? 'bg-[#FF3B30] text-white' : 'bg-[#CCFF00] text-[#111111]'}`}>
          <span className="text-2xl font-bold tabular-nums">{formatCurrency(remaining)}</span>
        </div>
      </div>
    </div>
  )
}
