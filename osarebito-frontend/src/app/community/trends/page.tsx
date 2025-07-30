'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { trendingPostsUrl } from '@/routes'
import {
  HeartIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline'

interface Tag { name: string; count: number }
interface Post {
  id: number
  author_id: string
  content: string
  likes?: string[]
  retweets?: string[]
  image?: string | null
  anonymous?: boolean
}

export default function CommunityTrends() {
  const [tags, setTags] = useState<Tag[]>([])
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    axios.get('/api/popular_tags').then((res) => setTags(res.data || []))
    axios.get(trendingPostsUrl).then((res) => {
      const list = res.data.posts || []
      const anon = localStorage.getItem('anonymousMode') === '1'
      setPosts(list.filter((p: Post) => (anon ? p.anonymous : !p.anonymous)))
    })
  }, [])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">トレンド</h1>
      <section>
        <h2 className="font-semibold mb-2">人気タグ</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link
              key={t.name}
              href={`/community/tag/${encodeURIComponent(t.name)}`}
              className="bg-pink-100 px-2 py-1 text-sm underline"
            >
              #{t.name} ({t.count})
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-semibold mb-2">人気投稿</h2>
        {posts.map((p) => (
          <div key={p.id} className="border rounded-lg bg-white p-3 mb-3 shadow">
           <div className="text-sm text-gray-600">{p.author_id}</div>
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
      </section>
    </div>
  )
}
