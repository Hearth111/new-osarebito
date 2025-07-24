'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'next/navigation'

interface Post {
  id: number
  author_id: string
  content: string
  category?: string | null
  likes?: string[]
  retweets?: string[]
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
        <div key={p.id} className="border p-2">
          <div className="text-sm text-gray-600">{p.author_id}</div>
          {p.category && (
            <div className="text-xs text-pink-600 mb-1">[{p.category}]</div>
          )}
          <p>{p.content}</p>
          <div className="text-xs text-gray-600 mt-1">
            いいね {p.likes ? p.likes.length : 0} / リツイート{' '}
            {p.retweets ? p.retweets.length : 0}
          </div>
        </div>
      ))}
    </div>
  )
}
