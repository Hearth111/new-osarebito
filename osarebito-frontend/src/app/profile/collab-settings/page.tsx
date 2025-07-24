'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { getCollabProfileUrl } from '@/routes'
import { useRouter } from 'next/navigation'

export default function CollabProfileSettings() {
  const [interests, setInterests] = useState('')
  const [lookingFor, setLookingFor] = useState('')
  const [availability, setAvailability] = useState('')
  const [visibility, setVisibility] = useState('private')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem('userId') || ''
    if (!userId) return
    fetch(getCollabProfileUrl(userId), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (data.interests) setInterests(data.interests)
          if (data.looking_for) setLookingFor(data.looking_for)
          if (data.availability) setAvailability(data.availability)
          if (data.visibility) setVisibility(data.visibility)
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
      const payload: Record<string, unknown> = {}
      if (interests) payload.interests = interests
      if (lookingFor) payload.looking_for = lookingFor
      if (availability) payload.availability = availability
      if (visibility) payload.visibility = visibility
      const res = await axios.put(`/api/users/${userId}/collab_profile`, payload)
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
      <h1 className="text-2xl font-bold mb-4">コラボ用プロフィール編集</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          className="border p-2"
          placeholder="趣味・嗜好"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
        />
        <textarea
          className="border p-2"
          placeholder="募集内容"
          value={lookingFor}
          onChange={(e) => setLookingFor(e.target.value)}
        />
        <input
          className="border p-2"
          type="text"
          placeholder="可能な日時"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
        />
        <select
          className="border p-2"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <option value="private">非公開</option>
          <option value="public">公開</option>
        </select>
        <button className="bg-pink-500 text-white py-2" type="submit">
          保存
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}
