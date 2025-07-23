'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface Props {
  targetId: string
  followers: string[]
}

export default function FollowButton({ targetId, followers }: Props) {
  const [ready, setReady] = useState(false)
  const [following, setFollowing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const myId = localStorage.getItem('userId') || ''
    if (myId) {
      setFollowing(followers.includes(myId))
    }
    setReady(true)
  }, [followers])

  const handleClick = async () => {
    const myId = localStorage.getItem('userId') || ''
    if (!myId || myId === targetId) return
    try {
      const payload = { follower_id: myId }
      if (following) {
        await axios.post(`/api/users/${targetId}/unfollow`, payload)
      } else {
        await axios.post(`/api/users/${targetId}/follow`, payload)
      }
      setFollowing(!following)
      router.refresh()
    } catch {
      // ignore
    }
  }

  if (!ready) return null
  return (
    <button className="bg-pink-500 text-white px-4 py-1" onClick={handleClick}>
      {following ? 'フォロー中' : 'フォローする'}
    </button>
  )
}
