'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function ProfileSettings() {
  const [profileImage, setProfileImage] = useState('')
  const [bio, setBio] = useState('')
  const [activity, setActivity] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [message, setMessage] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const id = localStorage.getItem('userId') || ''
    setUserId(id)
    if (!id) return
    axios.get(`/api/users/${id}`).then((res) => {
      const prof = res.data.profile || {}
      setProfileImage(prof.profile_image || '')
      setBio(prof.bio || '')
      setActivity(prof.activity || '')
      setVisibility(prof.visibility || 'public')
    }).catch(() => setMessage('Error loading'))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.put(`/api/users/${userId}/profile`, {
        profile_image: profileImage,
        bio,
        activity,
        visibility,
      })
      if (res.status === 200) {
        setMessage('更新しました')
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const anyErr = err as { response?: { data?: { detail?: string } } }
        setMessage(anyErr.response?.data?.detail || 'Error')
      } else {
        setMessage('Error')
      }
    }
  }

  if (!userId) {
    return <div className="max-w-md mx-auto mt-10">ログインしてください</div>
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">プロフィール設定</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="border p-2"
          type="text"
          placeholder="画像URL"
          value={profileImage}
          onChange={(e) => setProfileImage(e.target.value)}
        />
        <textarea
          className="border p-2"
          placeholder="自己紹介"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <input
          className="border p-2"
          type="text"
          placeholder="活動内容"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
        />
        <select
          className="border p-2"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <option value="public">公開</option>
          <option value="private">非公開</option>
        </select>
        <button className="bg-blue-500 text-white py-2" type="submit">
          保存
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}
