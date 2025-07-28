'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'

interface Post {
  id: number
  author_id: string
  content: string
  created_at: string
  category?: string | null
}

export default function CommunityBookmarks() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    const uid = localStorage.getItem('userId') || ''
    if (!uid) return
    axios.get(`/api/users/${uid}/bookmarks`).then((res) => {
      setPosts(res.data.posts || [])
    })
  }, [])

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">ブックマーク一覧</h1>
      {posts.map((p) => (
        <div key={p.id} className="border rounded-lg bg-white p-4 shadow mb-3">
          <div className="text-sm text-gray-600">{p.author_id}</div>
          {p.category && (
            <div className="text-xs text-pink-600 mb-1">[{p.category}]</div>
          )}
          <p>{p.content}</p>
          <Link
            href={`/community#post-${p.id}`}
            className="text-xs text-pink-500 underline"
          >
            元の投稿へ
          </Link>
        </div>
      ))}
      {posts.length === 0 && <p>ブックマークはありません。</p>}
    </div>
  )
}
