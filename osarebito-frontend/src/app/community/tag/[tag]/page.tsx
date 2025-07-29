'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { HeartIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'

interface Post {
  id: number
  author_id: string
  content: string
  category?: string | null
  likes?: string[]
  retweets?: string[]
  image?: string | null
}

export default function TagPostsPage() {
  const params = useParams() as { tag: string }
  const tag = params.tag
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    axios.get(`/api/posts/tag/${encodeURIComponent(tag)}`).then((res) => {
      setPosts(res.data.posts || [])
    })
  }, [tag])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">#{tag} の投稿</h1>
      {posts.map((p) => (
        <div key={p.id} className="border rounded-lg bg-white p-3 shadow">
          <div className="text-sm text-gray-600">{p.author_id}</div>
          {p.category && (
            <div className="text-xs text-pink-600 mb-1">[{p.category}]</div>
          )}
          <p>{p.content}</p>
          {p.image && (
            <img src={p.image} alt="post image" className="max-h-60 mt-2" />
          )}
          <div className="text-xs text-gray-600 mt-1 flex items-center gap-4">
            <span className="flex items-center gap-1">
              <HeartIcon className="w-4 h-4" />
              {p.likes ? p.likes.length : 0}
            </span>
            <span className="flex items-center gap-1">
              <ArrowsRightLeftIcon className="w-4 h-4" />
              リポスト {p.retweets ? p.retweets.length : 0}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
