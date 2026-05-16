import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { COLOR_KEYS } from '@/lib/categoryColors'
import { DEFAULT_CATEGORIES } from '@/types'

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  let categories = await prisma.userCategory.findMany({
    where: { user_id: userId },
    orderBy: { sort_order: 'asc' },
  })
  if (categories.length === 0) {
    await prisma.userCategory.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId })),
    })
    categories = await prisma.userCategory.findMany({
      where: { user_id: userId },
      orderBy: { sort_order: 'asc' },
    })
  }
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const body = await request.json()
  const { name, color } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!COLOR_KEYS.includes(color)) return NextResponse.json({ error: 'Invalid color' }, { status: 400 })

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

  const existing = await prisma.userCategory.findUnique({
    where: { user_id_slug: { user_id: userId, slug } },
  })
  if (existing) return NextResponse.json({ error: 'A category with that name already exists' }, { status: 409 })

  const count = await prisma.userCategory.count({ where: { user_id: userId } })
  const category = await prisma.userCategory.create({
    data: { user_id: userId, name: name.trim(), slug, color, sort_order: count },
  })
  return NextResponse.json(category, { status: 201 })
}
