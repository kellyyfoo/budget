'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

interface Friend {
  friendshipId: number
  id: number
  name: string | null
  username: string | null
  avatar_url: string | null
}

interface SearchResult {
  id: number
  name: string | null
  username: string | null
  avatar_url: string | null
  relation: 'none' | 'friends' | 'sent' | 'received'
  friendshipId: number | null
}

interface FriendsModalProps {
  open: boolean
  onClose: () => void
}

function Avatar({ name, avatarUrl, size = 8 }: { name: string | null; avatarUrl: string | null; size?: number }) {
  const initial = (name ?? '?')[0].toUpperCase()
  const sizeClass = size === 8 ? 'w-8 h-8' : 'w-7 h-7'
  const textClass = size === 8 ? 'text-[11px]' : 'text-[10px]'
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-[#E5E5E0] flex items-center justify-center flex-shrink-0`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className={`${textClass} font-medium text-[#111111]`}>{initial}</span>
      )}
    </div>
  )
}

export default function FriendsModal({ open, onClose }: FriendsModalProps) {
  const [friends, setFriends] = useState<Friend[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchError, setSearchError] = useState('')
  const [searching, setSearching] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadFriends = useCallback(async () => {
    const res = await fetch('/api/friends')
    if (res.ok) setFriends(await res.json())
  }, [])

  useEffect(() => {
    if (open) { loadFriends(); setSearchQuery(''); setSearchResults([]) }
  }, [open, loadFriends])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (searchQuery.trim().length < 2) { setSearchResults([]); setSearchError(''); return }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      setSearchError('')
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`)
        if (res.ok) {
          setSearchResults(await res.json())
        } else {
          const data = await res.json().catch(() => ({}))
          setSearchResults([])
          setSearchError(data.error ?? `Search failed (${res.status})`)
        }
      } catch {
        setSearchResults([])
        setSearchError('Network error — please try again')
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchQuery])

  async function handleAdd(result: SearchResult) {
    setActionLoadingId(result.id)
    try {
      await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: result.username }),
      })
      setSearchResults((prev) =>
        prev.map((r) => r.id === result.id ? { ...r, relation: 'sent' } : r)
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleAccept(result: SearchResult) {
    if (!result.friendshipId) return
    setActionLoadingId(result.id)
    try {
      await fetch(`/api/friends/${result.friendshipId}/accept`, { method: 'POST' })
      setSearchResults((prev) =>
        prev.map((r) => r.id === result.id ? { ...r, relation: 'friends' } : r)
      )
      loadFriends()
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleRemove(friendshipId: number) {
    setRemovingId(friendshipId)
    try {
      await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' })
      setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Friends">
      <div className="space-y-7">
        {/* Search */}
        <div>
          <Input
            label="Find friends"
            type="text"
            placeholder="Search by name or username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {searchQuery.trim().length >= 2 && (
            <div className="mt-3 space-y-1">
              {searching && (
                <p className="text-[10px] text-[#BBBBBB] tracking-wide">Searching…</p>
              )}
              {!searching && searchError && (
                <p className="text-[10px] text-red-500 tracking-wide">{searchError}</p>
              )}
              {!searching && !searchError && searchResults.length === 0 && (
                <p className="text-[10px] text-[#BBBBBB] tracking-wide">No users found</p>
              )}
              {searchResults.map((result) => (
                <div key={result.id} className="flex items-center gap-3 py-2 border-b border-[#E5E5E0] last:border-b-0">
                  <Avatar name={result.name ?? result.username} avatarUrl={result.avatar_url} size={7} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-light text-[#111111] truncate">
                      {result.name ?? result.username}
                    </p>
                    {result.username && (
                      <p className="text-[9px] text-[#BBBBBB]">@{result.username}</p>
                    )}
                  </div>
                  {result.relation === 'friends' && (
                    <span className="text-[9px] tracking-[0.1em] uppercase text-[#BBBBBB]">Friends</span>
                  )}
                  {result.relation === 'sent' && (
                    <span className="text-[9px] tracking-[0.1em] uppercase text-[#BBBBBB]">Requested</span>
                  )}
                  {result.relation === 'received' && (
                    <button
                      onClick={() => handleAccept(result)}
                      disabled={actionLoadingId === result.id}
                      className="text-[9px] tracking-[0.1em] uppercase text-[#111111] hover:opacity-60 transition-opacity cursor-pointer disabled:opacity-40"
                    >
                      Accept
                    </button>
                  )}
                  {result.relation === 'none' && (
                    <button
                      onClick={() => handleAdd(result)}
                      disabled={actionLoadingId === result.id}
                      className="text-[9px] tracking-[0.1em] uppercase text-[#111111] hover:opacity-60 transition-opacity cursor-pointer disabled:opacity-40"
                    >
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friends list */}
        <div>
          <p className="text-[9px] tracking-[0.2em] uppercase text-[#BBBBBB] mb-3">
            {friends.length === 0 ? 'No friends yet' : `${friends.length} friend${friends.length === 1 ? '' : 's'}`}
          </p>
          {friends.length > 0 && (
            <div className="space-y-1">
              {friends.map((friend) => (
                <div key={friend.friendshipId} className="flex items-center gap-3 py-2">
                  <Avatar name={friend.name ?? friend.username} avatarUrl={friend.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-light text-[#111111] truncate">
                      {friend.name ?? friend.username}
                    </p>
                    {friend.name && friend.username && (
                      <p className="text-[9px] text-[#BBBBBB]">@{friend.username}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(friend.friendshipId)}
                    disabled={removingId === friend.friendshipId}
                    className="text-[9px] tracking-[0.1em] uppercase text-[#BBBBBB] hover:text-[#111111] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
