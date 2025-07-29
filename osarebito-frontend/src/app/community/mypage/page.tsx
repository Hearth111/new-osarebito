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
  image?: string | null
}

export default function CommunityMyPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [retweets, setRetweets] = useState<Post[]>([])

  useEffect(() => {
    const uid = localStorage.getItem('userId') || ''
    if (!uid) return
    axios.get(`/api/posts?feed=user&user_id=${uid}`).then((res) => {
      setPosts(res.data.posts || [])
    })
    axios.get(`/api/users/${uid}/retweets`).then((res) => {
      setRetweets(res.data.posts || [])
    })
  }, [])

  const Card = ({ p }: { p: Post }) => (
    <div key={p.id} className="rounded-lg bg-white p-4 shadow mb-3">
      <div className="text-sm text-gray-600">{p.author_id}</div>
      {p.category && <div className="text-xs text-pink-600 mb-1">[{p.category}]</div>}
      <p>{p.content}</p>
      {p.image && <img src={p.image} alt="post image" className="max-h-60 mt-2" />}
      <Link href={`/community/post/${p.id}`} className="text-xs text-pink-500 underline">
        詳細
      </Link>
    </div>
  )

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">マイページ</h1>
      <section>
        <h2 className="font-semibold mb-2">自分の投稿</h2>
        {posts.map((p) => (
          <Card key={p.id} p={p} />
        ))}
        {posts.length === 0 && <p>投稿がありません。</p>}
      </section>
      <section>
        <h2 className="font-semibold mb-2">リポストした投稿</h2>
        {retweets.map((p) => (
          <Card key={p.id} p={p} />
        ))}
        {retweets.length === 0 && <p>リポストはありません。</p>}
      </section>
    </div>
  )
}
