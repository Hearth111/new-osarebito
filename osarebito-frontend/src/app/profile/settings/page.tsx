'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function ProfileSettings() {
  const [bio, setBio] = useState('')
  const [activity, setActivity] = useState('')
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const id = localStorage.getItem('userId')
    if (!id) {
      router.push('/login')
      return
    }
    setUserId(id)
    axios.get(`/api/users/${id}`).then((res) => {
      const p = res.data.profile || {}
      setBio(p.bio || '')
      setActivity(p.activity || '')
    })
  }, [router])

  const handleSave = async () => {
    if (!userId) return
    await axios.put(`/api/users/${userId}/profile`, { bio, activity })
    setMessage('Saved')
  }

  return (
    <div className="max-w-md mx-auto mt-10 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">プロフィール設定</h1>
      <textarea
        className="border p-2"
        placeholder="Bio"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />
      <textarea
        className="border p-2"
        placeholder="Activity"
        value={activity}
        onChange={(e) => setActivity(e.target.value)}
      />
      <button className="bg-blue-500 text-white py-2" onClick={handleSave}>
        Save
      </button>
      {message && <p>{message}</p>}
    </div>
  )
}
