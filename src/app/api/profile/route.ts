import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, avatar_url: true, email: true, phone: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}

export async function PUT(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '0')
  const body = await request.json()
  const { name } = body

  const user = await prisma.user.update({
    where: { id: userId },
    data: { ...(name !== undefined && { name: name?.trim() || null }) },
    select: { id: true, name: true, avatar_url: true, email: true, phone: true },
  })
  return NextResponse.json(user)
}
