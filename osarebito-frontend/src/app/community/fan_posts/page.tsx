'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { fanPostsUrl } from '@/routes'

interface FanPost {
  id: number
  author_id: string
  content: string
  created_at: string
}

export default function FanPosts() {
  const [posts, setPosts] = useState<FanPost[]>([])
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : ''

  const load = async () => {
    if (!uid) return
    try {
      const res = await axios.get(`${fanPostsUrl}?viewer_id=${uid}`)
      setPosts(res.data.posts || [])
      setError('')
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 403) {
        setError('ファン専用の掲示板です。')
      } else {
        setError('読み込みに失敗しました')
      }
    }
  }

  useEffect(() => {
    load()
  }, [uid])

  const submit = async () => {
    if (!uid || !content) return
    try {
      await axios.post(fanPostsUrl, { author_id: uid, content })
      setContent('')
      load()
    } catch {
      alert('投稿に失敗しました')
    }
  }

  if (!uid) {
    return <p className="p-4">ログインしてください。</p>
  }

  if (error) {
    return <p className="p-4">{error}</p>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">ファン掲示板</h1>
      <div className="space-y-2 border rounded-lg bg-white p-3 shadow">
        <textarea
          className="border rounded p-1 w-full"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="投稿内容"
        />
        <button className="bg-pink-500 hover:bg-pink-600 text-white rounded px-3 transition" onClick={submit}>
          投稿
        </button>
      </div>
      <div className="space-y-4">
        {posts.map((p) => (
          <div key={p.id} className="border rounded-lg bg-white p-4 shadow">
            <div className="text-sm text-gray-600">{p.author_id}</div>
            <p className="whitespace-pre-wrap">{p.content}</p>
          </div>
        ))}
        {posts.length === 0 && <p>投稿はありません。</p>}
      </div>
    </div>
  )
}
