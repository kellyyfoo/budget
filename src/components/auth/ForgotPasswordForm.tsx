'use client'

import { useState } from 'react'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ForgotPasswordForm() {
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [sent, setSent] = useState(false)
  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }
      setMethod(data.method ?? 'email')
      setSent(true)
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

        {sent ? (
          <div className="text-center space-y-6">
            <p className="text-sm font-light text-[#111111]">
              {method === 'email'
                ? 'Check your email for a 6-digit code.'
                : 'Check your phone for a 6-digit code.'}
            </p>
            <Link
              href={`/reset-password?contact=${encodeURIComponent(emailOrPhone)}`}
              className="inline-block text-[11px] tracking-[0.15em] uppercase text-[#111111] underline underline-offset-2"
            >
              Enter Code
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-7">
            <Input
              label="Email or Phone"
              type="text"
              placeholder="you@example.com"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
            />

            {error && <p className="text-[11px] text-red-500 tracking-wide">{error}</p>}

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full" loading={loading}>
                Send Code
              </Button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="text-[11px] text-[#999999] hover:text-[#111111] transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
