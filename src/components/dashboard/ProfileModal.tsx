'use client'

import { useState, useRef } from 'react'
import type { UserProfile } from '@/types'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface ProfileModalProps {
  open: boolean
  onClose: () => void
  profile: UserProfile | null
  onUpdate: (profile: UserProfile) => void
}

export default function ProfileModal({ open, onClose, profile, onUpdate }: ProfileModalProps) {
  const nameParts = (profile?.name ?? '').split(' ')
  const [firstName, setFirstName] = useState(nameParts[0] ?? '')
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' '))
  const [username, setUsername] = useState(profile?.username ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const initial = (profile?.name ?? profile?.email ?? profile?.username ?? '?')[0].toUpperCase()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('avatar', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Upload failed')
        return
      }
      const data = await res.json()
      setAvatarUrl(data.avatar_url)
      if (profile) onUpdate({ ...profile, avatar_url: data.avatar_url, username: profile.username })
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null, username: username.trim() || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Failed to save')
        return
      }
      const updated = await res.json()
      onUpdate(updated)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Profile">
      <form onSubmit={handleSave} className="space-y-8">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative group cursor-pointer"
            aria-label="Change photo"
          >
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#E5E5E0] flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-light text-[#111111]">{initial}</span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-[#111111]/0 group-hover:bg-[#111111]/30 transition-colors flex items-center justify-center">
              {uploading ? (
                <span className="inline-block w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="1.8"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
            </div>
          </button>
          <p className="text-[10px] tracking-[0.1em] uppercase text-[#111111]">Click to change photo</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <Input
          label="First Name"
          type="text"
          placeholder="Kelly"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />

        <Input
          label="Last Name"
          type="text"
          placeholder="Foo"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <Input
          label="Username"
          type="text"
          placeholder="your_username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {error && <p className="text-[11px] text-red-500 tracking-wide">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="primary" loading={saving} className="flex-1">
            Save
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
