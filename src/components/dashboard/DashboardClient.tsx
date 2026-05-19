'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Expense, BudgetMonthData, UserCategory, UserProfile, RecurringExpense } from '@/types'
import BudgetSummary from './BudgetSummary'
import CategoryBreakdown from './CategoryBreakdown'
import ExpenseTable from './ExpenseTable'
import ExpenseForm from './ExpenseForm'
import ManageCategories from './ManageCategories'
import ProfileModal from './ProfileModal'
import RecurringModal from './RecurringModal'
import FriendActivitySidebar from './FriendActivitySidebar'
import FriendsModal from './FriendsModal'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface DashboardClientProps {
  initialBudget: BudgetMonthData
  initialExpenses: Expense[]
  initialYear: number
  initialMonth: number
  initialCategories: UserCategory[]
  initialProfile: UserProfile | null
  initialRecurring: RecurringExpense[]
}

export default function DashboardClient({
  initialBudget,
  initialExpenses,
  initialYear,
  initialMonth,
  initialCategories,
  initialProfile,
  initialRecurring,
}: DashboardClientProps) {
  const router = useRouter()
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [budget, setBudget] = useState<BudgetMonthData>(initialBudget)
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [categories, setCategories] = useState<UserCategory[]>(initialCategories)
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile)
  const [recurring, setRecurring] = useState<RecurringExpense[]>(initialRecurring)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showManage, setShowManage] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    if (showProfileMenu) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfileMenu])

  const expensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0)

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const filteredExpenses = trimmedQuery
    ? expenses.filter((e) => e.description.toLowerCase().includes(trimmedQuery))
    : expenses

  async function fetchMonth(y: number, m: number) {
    // Fetch budget first so the BudgetMonth is created (and recurring expenses seeded)
    // before the expenses GET runs — prevents a race condition on first visit to a new month.
    const budgetRes = await fetch(`/api/budget?year=${y}&month=${m}`)
    const [budget, expensesRes] = await Promise.all([
      budgetRes.json(),
      fetch(`/api/expenses?year=${y}&month=${m}`),
    ])
    setBudget(budget)
    setExpenses(await expensesRes.json())
  }

  function prevMonth() {
    const m = month === 1 ? 12 : month - 1
    const y = month === 1 ? year - 1 : year
    setYear(y)
    setMonth(m)
    setSearchQuery('')
    fetchMonth(y, m)
  }

  function nextMonth() {
    const m = month === 12 ? 1 : month + 1
    const y = month === 12 ? year + 1 : year
    setYear(y)
    setMonth(m)
    setSearchQuery('')
    fetchMonth(y, m)
  }

  const handleUpdateBudget = useCallback(
    async (field: 'net_income' | 'rent' | 'savings_goal', value: number) => {
      const res = await fetch(`/api/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, [field]: value }),
      })
      if (res.ok) setBudget(await res.json())
    },
    [year, month]
  )

  const handleAddExpense = useCallback(
    async (data: Omit<Expense, 'id' | 'created_at'> & { year: number; month: number }) => {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to add expense')
      }
      const expense = await res.json()
      setExpenses((prev) =>
        [expense, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      )
      setShowAdd(false)
    },
    []
  )

  const handleEditExpense = useCallback(
    async (data: Omit<Expense, 'id' | 'created_at'> & { year: number; month: number }) => {
      if (!editingExpense) return
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to update expense')
      }
      const updated = await res.json()
      setExpenses((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      )
      setEditingExpense(null)
    },
    [editingExpense]
  )

  const handleDeleteExpense = useCallback(async (id: number) => {
    const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    }
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const firstName = profile?.name?.split(' ')[0]

  return (
    <div className="h-screen bg-[#FAFAF8] flex flex-row overflow-hidden">
    <div className="flex flex-col flex-1 overflow-y-auto min-w-0">
      {/* Header */}
      <header className="border-b border-[#E5E5E0] px-10 py-5 flex items-center justify-between">
        <span className="text-base tracking-[0.5em] uppercase font-bold text-[#111111]">
          Budget
        </span>
        <div className="flex items-center gap-5">
          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1 text-[#111111] transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-[10px] tracking-[0.15em] uppercase text-[#111111] w-24 text-center select-none">
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 text-[#111111] transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              className="flex items-center gap-2 cursor-pointer group"
              aria-label="Profile menu"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-[#E5E5E0] flex items-center justify-center flex-shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-medium text-[#111111]">
                    {(profile?.name ?? profile?.email ?? '?')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-[0.1em] uppercase text-[#111111] transition-colors">
                {firstName ? `Welcome, ${firstName}` : 'Profile'}
              </span>
              <svg
                width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8"
                className="text-[#CCCCCC] group-hover:text-[#111111] transition-colors"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 bg-[#FAFAF8] border border-[#E5E5E0] z-50 min-w-[160px] py-1 shadow-sm">
                <button
                  onClick={() => { setShowProfile(true); setShowProfileMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase text-[#111111] hover:bg-[#F5F5F0] transition-colors cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => { setShowManage(true); setShowProfileMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase text-[#111111] hover:bg-[#F5F5F0] transition-colors cursor-pointer"
                >
                  Manage Categories
                </button>
                <button
                  onClick={() => { setShowRecurring(true); setShowProfileMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase text-[#111111] hover:bg-[#F5F5F0] transition-colors cursor-pointer"
                >
                  Set Monthly Defaults
                </button>
                <button
                  onClick={() => { setShowFriends(true); setShowProfileMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase text-[#111111] hover:bg-[#F5F5F0] transition-colors cursor-pointer"
                >
                  Friends
                </button>
                <div className="border-t border-[#E5E5E0] my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-[10px] tracking-[0.15em] uppercase text-[#111111] hover:bg-[#F5F5F0] transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Summary Band */}
      <BudgetSummary
        budgetMonth={budget}
        expensesTotal={expensesTotal}
        onUpdate={handleUpdateBudget}
      />

      {/* Category Breakdown */}
      <CategoryBreakdown
        expenses={expenses}
        categories={categories}
        onManage={() => setShowManage(true)}
      />

      {/* Controls Row */}
      <div className="px-10 py-5 flex items-center justify-between border-b border-[#E5E5E0]">
        <span className="text-[11px] tracking-[0.2em] uppercase text-[#111111] font-semibold">
          Expenses &mdash; {MONTH_NAMES[month - 1]} {year}
        </span>
        <Button variant="ghost" size="sm" onClick={() => setShowAdd(true)}>
          + Add Expense
        </Button>
      </div>

      {/* Search Row */}
      <div className="px-10 pt-4 pb-2">
        <div className="relative inline-flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expenses..."
            className="bg-transparent border-b border-[#E5E5E0] focus:border-[#111111] outline-none py-1 pr-5 text-[11px] font-light text-[#111111] placeholder:text-[#BBBBBB] transition-colors w-48"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-0 text-[#111111] hover:opacity-60 transition-opacity cursor-pointer"
              aria-label="Clear search"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expense Table */}
      <div className="flex-1 px-10 pt-2 pb-12">
        <ExpenseTable
          expenses={searchQuery ? expenses.filter((e) => e.description.toLowerCase().includes(searchQuery.toLowerCase())) : expenses}
          categories={categories}
          onEdit={(expense) => setEditingExpense(expense)}
          onDelete={handleDeleteExpense}
          emptyMessage={
            trimmedQuery ? `No expenses match “${searchQuery.trim()}”.` : undefined
          }
        />
      </div>

      {/* Footer */}
      <footer className="border-t border-[#E5E5E0] px-10 py-5">
        <span className="text-[9px] tracking-[0.2em] uppercase text-[#111111]">
          Budget &mdash; {year}
        </span>
      </footer>

      {/* Add Expense Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Expense">
        {showAdd && (
          <ExpenseForm
            year={year}
            month={month}
            categories={categories}
            onSubmit={handleAddExpense}
            onCancel={() => setShowAdd(false)}
          />
        )}
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        open={editingExpense !== null}
        onClose={() => setEditingExpense(null)}
        title="Edit Expense"
      >
        {editingExpense && (
          <ExpenseForm
            initial={editingExpense}
            year={year}
            month={month}
            categories={categories}
            onSubmit={handleEditExpense}
            onCancel={() => setEditingExpense(null)}
          />
        )}
      </Modal>

      {/* Manage Categories */}
      <ManageCategories
        open={showManage}
        onClose={() => setShowManage(false)}
        categories={categories}
        onChange={setCategories}
      />

      {/* Recurring */}
      <RecurringModal
        open={showRecurring}
        onClose={() => setShowRecurring(false)}
        profile={profile}
        categories={categories}
        recurring={recurring}
        onRecurringChange={setRecurring}
        onRefresh={() => fetchMonth(year, month)}
      />

      {/* Profile */}
      <ProfileModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        profile={profile}
        onUpdate={(updated) => {
          setProfile(updated)
          setShowProfile(false)
        }}
      />

      {/* Friends */}
      <FriendsModal open={showFriends} onClose={() => setShowFriends(false)} />
    </div>

    <FriendActivitySidebar onOpenFriends={() => setShowFriends(true)} />
    </div>
  )
}
