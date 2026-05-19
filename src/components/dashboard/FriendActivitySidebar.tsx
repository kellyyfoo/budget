'use client'

import { useEffect, useState, useCallback } from 'react'

interface FriendRequest {
  friendshipId: number
  id: number
  name: string | null
  username: string | null
  avatar_url: string | null
}

interface ActivityItem {
  id: number
  friendId: number
  friendName: string
  friendAvatarUrl: string | null
  amount: number
  category: string
  date: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function Avatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  const initial = (name ?? '?')[0].toUpperCase()
  return (
    <div className="w-7 h-7 rounded-full overflow-hidden bg-[#E5E5E0] flex items-center justify-center flex-shrink-0">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] font-medium text-[#111111]">{initial}</span>
      )}
    </div>
  )
}

interface FriendActivitySidebarProps {
  onOpenFriends: () => void
}

export default function FriendActivitySidebar({ onOpenFriends }: FriendActivitySidebarProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [hasFriends, setHasFriends] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [reqRes, actRes, friendsRes] = await Promise.all([
      fetch('/api/friends/requests'),
      fetch('/api/friends/activity'),
      fetch('/api/friends'),
    ])
    if (reqRes.ok) setRequests(await reqRes.json())
    if (actRes.ok) setActivity(await actRes.json())
    if (friendsRes.ok) {
      const friends = await friendsRes.json()
      setHasFriends(friends.length > 0)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAccept(friendshipId: number) {
    await fetch(`/api/friends/${friendshipId}/accept`, { method: 'POST' })
    setRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId))
    setHasFriends(true)
    load()
  }

  async function handleReject(friendshipId: number) {
    await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' })
    setRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId))
  }

  return (
    <aside className="w-64 border-l border-[#E5E5E0] flex flex-col flex-shrink-0 overflow-y-auto bg-[#FAFAF8]">
      <div className="px-5 py-5 border-b border-[#E5E5E0]">
        <span className="text-[10px] tracking-[0.3em] uppercase font-semibold text-[#111111]">
          Friend Activity
        </span>
      </div>

      {loading ? null : (
        <>
          {/* Pending requests */}
          {requests.length > 0 && (
            <div className="border-b border-[#E5E5E0]">
              <p className="px-5 pt-4 pb-2 text-[9px] tracking-[0.2em] uppercase text-[#BBBBBB]">
                Friend Requests
              </p>
              {requests.map((req) => (
                <div key={req.friendshipId} className="px-5 py-3 flex items-center gap-3">
                  <Avatar name={req.name ?? req.username} avatarUrl={req.avatar_url} />
                  <span className="text-[11px] font-light text-[#111111] flex-1 min-w-0 truncate">
                    {req.name ?? req.username}
                  </span>
                  <button
                    onClick={() => handleAccept(req.friendshipId)}
                    className="text-[#111111] hover:opacity-60 transition-opacity cursor-pointer"
                    aria-label="Accept"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleReject(req.friendshipId)}
                    className="text-[#111111] hover:opacity-60 transition-opacity cursor-pointer"
                    aria-label="Reject"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Activity feed */}
          {activity.length > 0 ? (
            <div className="flex flex-col">
              {activity.map((item) => (
                <div key={item.id} className="px-5 py-3 border-b border-[#E5E5E0] last:border-b-0">
                  <div className="flex items-center gap-3 mb-1">
                    <Avatar name={item.friendName} avatarUrl={item.friendAvatarUrl} />
                    <span className="text-[11px] font-light text-[#111111] flex-1 truncate">
                      {item.friendName}
                    </span>
                    <span className="text-[11px] font-medium text-[#111111]">
                      ${item.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="pl-10 flex items-center justify-between">
                    <span className="text-[9px] tracking-[0.1em] uppercase text-[#BBBBBB]">
                      {item.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[9px] text-[#BBBBBB]">{timeAgo(item.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !hasFriends && (
              <div className="flex flex-col items-center justify-center flex-1 px-5 py-12 text-center gap-4">
                <p className="text-[11px] font-light text-[#111111]">
                  Add friends to see their spending
                </p>
                <button
                  onClick={onOpenFriends}
                  className="text-[10px] tracking-[0.15em] uppercase text-[#111111] border border-[#E5E5E0] px-4 py-2 hover:bg-[#F5F5F0] transition-colors cursor-pointer"
                >
                  Find Friends
                </button>
              </div>
            )
          )}
        </>
      )}
    </aside>
  )
}
