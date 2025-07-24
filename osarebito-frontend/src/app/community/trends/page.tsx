'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { trendingPostsUrl } from '@/routes'

interface Tag { name: string; count: number }
interface Post {
  id: number
  author_id: string
  content: string
  likes?: string[]
  retweets?: string[]
}

export default function CommunityTrends() {
  const [tags, setTags] = useState<Tag[]>([])
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    axios.get('/api/popular_tags').then((res) => setTags(res.data || []))
    axios.get(trendingPostsUrl).then((res) => setPosts(res.data.posts || []))
  }, [])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">トレンド</h1>
      <section>
        <h2 className="font-semibold mb-2">人気タグ</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t.name} className="bg-pink-100 px-2 py-1 text-sm">
              #{t.name} ({t.count})
            </span>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-semibold mb-2">人気投稿</h2>
        {posts.map((p) => (
          <div key={p.id} className="border p-2 mb-2">
            <div className="text-sm text-gray-600">{p.author_id}</div>
            <p>{p.content}</p>
            <div className="text-xs text-gray-600 mt-1">
              いいね {p.likes ? p.likes.length : 0} / リツイート{' '}
              {p.retweets ? p.retweets.length : 0}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
