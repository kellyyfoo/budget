'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface AuthFormProps {
  mode: 'login' | 'register'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const body = mode === 'register'
        ? { firstName: firstName.trim(), lastName: lastName.trim(), username, password }
        : { usernameOrEmail: username, password }

      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
          {mode === 'register' && (
            <>
              <Input
                label="First Name"
                type="text"
                placeholder="Kelly"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
              />
              <Input
                label="Last Name"
                type="text"
                placeholder="Foo"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                required
              />
            </>
          )}
          <Input
            label="Username"
            type="text"
            placeholder="your_username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            required
          />
          {mode === 'register' && (
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          )}

          {error && (
            <p className="text-[11px] text-red-500 tracking-wide">{error}</p>
          )}

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              {mode === 'register' ? 'Create Account' : 'Sign In'}
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center">
          {mode === 'login' ? (
            <p className="text-[11px] text-[#111111]">
              No account?{' '}
              <Link href="/register" className="text-[#111111] underline underline-offset-2 hover:tracking-[0.12em] transition-all duration-200">
                Create one
              </Link>
            </p>
          ) : (
            <p className="text-[11px] text-[#111111]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#111111] underline underline-offset-2 hover:tracking-[0.12em] transition-all duration-200">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
