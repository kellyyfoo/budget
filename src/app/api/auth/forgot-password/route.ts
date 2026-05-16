import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOTPEmail } from '@/lib/mailer'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { emailOrPhone } = body

  if (!emailOrPhone) {
    return NextResponse.json({ error: 'Email or phone is required' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
  })

  // Always return success to avoid account enumeration
  if (!user) return NextResponse.json({ method: 'email' })

  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const expires_at = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.passwordReset.create({
    data: { user_id: user.id, otp, expires_at },
  })

  const isEmail = emailOrPhone.includes('@')
  if (isEmail && user.email) {
    await sendOTPEmail(user.email, otp)
  } else {
    // Phone OTP: log to console for now
    console.log(`\n📱 SMS OTP for ${emailOrPhone}: ${otp}\n`)
  }

  return NextResponse.json({ method: isEmail ? 'email' : 'phone' })
}
