'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [emailOrPhone, setEmailOrPhone] = useState(params.get('contact') ?? '')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, otp, newPassword: password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <span className="text-[11px] tracking-[0.4em] uppercase font-medium text-[#111111]">
            Budget
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <Input
            label="Email or Phone"
            type="text"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            required
          />
          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-[#111111] font-medium mb-2.5">
              6-Digit Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-transparent border-b border-[#E5E5E0] focus:border-[#111111] outline-none py-2 text-2xl font-light text-[#111111] text-center tracking-[0.5em] transition-colors placeholder:text-[#BBBBBB]"
              required
            />
          </div>
          <Input
            label="New Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />

          {error && <p className="text-[11px] text-red-500 tracking-wide">{error}</p>}

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Reset Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
