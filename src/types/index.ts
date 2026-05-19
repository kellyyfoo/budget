export type Category = string

export interface UserCategory {
  id: number
  name: string
  slug: string
  color: string
  sort_order: number
}

export interface Expense {
  id: number
  description: string
  amount: number
  date: string
  category: Category
  created_at: string
}

export interface BudgetMonthData {
  id?: number
  year: number
  month: number
  net_income: number
  rent: number
  savings_goal: number
}

export interface UserProfile {
  id: number
  name: string | null
  avatar_url: string | null
  email: string | null
  phone: string | null
  username: string | null
  default_net_income: number
  default_rent: number
  default_savings_goal: number
}

export interface RecurringExpense {
  id: number
  description: string
  amount: number
  category: string
  sort_order: number
}

export const DEFAULT_CATEGORIES: Omit<UserCategory, 'id'>[] = [
  { name: 'Groceries',      slug: 'groceries',      color: 'warm-gray',  sort_order: 0 },
  { name: 'Eating Out',     slug: 'eating_out',     color: 'sage',       sort_order: 1 },
  { name: 'Entertainment',  slug: 'entertainment',  color: 'slate-blue', sort_order: 2 },
  { name: 'Shopping',       slug: 'shopping',       color: 'dusty-rose', sort_order: 3 },
  { name: 'Health',         slug: 'health',         color: 'teal',       sort_order: 4 },
  { name: 'Transportation', slug: 'transportation', color: 'sand',       sort_order: 5 },
  { name: 'Travel',         slug: 'travel',         color: 'lavender',   sort_order: 6 },
]
