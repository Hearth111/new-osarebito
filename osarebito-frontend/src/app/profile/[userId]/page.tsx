'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface UserProfile {
  user_id: string
  username: string
  role: string
  profile?: {
    bio?: string
    activity?: string
  }
}

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    const load = async () => {
      const res = await axios.get(`/api/users/${params.userId}`)
      setUser(res.data)
    }
    load()
  }, [params.userId])

  if (!user) return <div className="max-w-md mx-auto mt-10">Loading...</div>
  const p = user.profile || {}
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">{user.username}のプロフィール</h1>
      <p>User ID: {user.user_id}</p>
      <p>Role: {user.role}</p>
      {p.bio && <p className="mt-2">Bio: {p.bio}</p>}
      {p.activity && <p className="mt-2">Activity: {p.activity}</p>}
    </div>
  )
}
