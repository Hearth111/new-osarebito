'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { getUserUrl } from '../../../routs'
import { useRouter } from 'next/navigation'

export default function ProfileSettings() {
  const [bio, setBio] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [activity, setActivity] = useState('')
  const [youtube, setYoutube] = useState('')
  const [twitter, setTwitter] = useState('')
  const [visibility, setVisibility] = useState('public')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const userId = localStorage.getItem('userId') || ''
    if (!userId) return
    fetch(getUserUrl(userId), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.profile) {
          const prof = data.profile
          if (prof.bio) setBio(prof.bio)
          if (prof.profile_image) setProfileImage(prof.profile_image)
          if (prof.activity) setActivity(prof.activity)
          if (prof.sns_links) {
            setYoutube(prof.sns_links.youtube || '')
            setTwitter(prof.sns_links.twitter || '')
          }
          if (prof.visibility) setVisibility(prof.visibility)
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
      const sns: Record<string, string> = {}
      if (youtube) sns.youtube = youtube
      if (twitter) sns.twitter = twitter
      const payload: Record<string, unknown> = {}
      if (bio) payload.bio = bio
      if (profileImage) payload.profile_image = profileImage
      if (activity) payload.activity = activity
      if (Object.keys(sns).length) payload.sns_links = sns
      if (visibility) payload.visibility = visibility

      const res = await axios.put(`/api/users/${userId}/profile`, payload)
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
        <input
          className="border p-2"
          type="text"
          placeholder="プロフィール画像URL"
          value={profileImage}
          onChange={(e) => setProfileImage(e.target.value)}
        />
        <textarea
          className="border p-2"
          placeholder="自己紹介"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <textarea
          className="border p-2"
          placeholder="活動内容"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
        />
        <input
          className="border p-2"
          type="text"
          placeholder="YouTubeリンク"
          value={youtube}
          onChange={(e) => setYoutube(e.target.value)}
        />
        <input
          className="border p-2"
          type="text"
          placeholder="Twitterリンク"
          value={twitter}
          onChange={(e) => setTwitter(e.target.value)}
        />
        <select
          className="border p-2"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
        >
          <option value="public">全体公開</option>
          <option value="followers">フォロワー限定</option>
          <option value="private">非公開</option>
        </select>
        <button className="bg-pink-500 text-white py-2" type="submit">
          保存
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}
