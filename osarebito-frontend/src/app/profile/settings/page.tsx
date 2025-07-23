'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { getUserUrl } from '../../../routs'
import { useRouter } from 'next/navigation'

export default function ProfileSettings() {
  const [bio, setBio] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem('userId') || ''
    if (!userId) return
    fetch(getUserUrl(userId), { cache: 'no-store' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.profile && data.profile.bio) {
          setBio(data.profile.bio)
        }
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const userId = localStorage.getItem('userId') || ''
    if (!userId) {
      setMessage('ログインしてください')
      return
    }
    try {
      const res = await axios.put(`/api/users/${userId}/profile`, { bio })
      setMessage(res.data.message)
      router.refresh()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const anyErr = err as { response?: { data?: { detail?: string } } }
        setMessage(anyErr.response?.data?.detail || 'Error')
      } else {
        setMessage('Error')
      }
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">プロフィール編集</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          className="border p-2"
          placeholder="自己紹介"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <button className="bg-blue-500 text-white py-2" type="submit">
          保存
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}
