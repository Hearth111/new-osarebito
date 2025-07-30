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
  anonymous?: boolean
}

interface UserProfile {
  profile_image?: string
  bio?: string
}

interface User {
  user_id: string
  username?: string
  profile?: UserProfile
}

export default function CommunityMyPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [retweets, setRetweets] = useState<Post[]>([])
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const uid = localStorage.getItem('userId') || ''
    if (!uid) return
    axios.get(`/api/users/${uid}`).then((res) => setUser(res.data))
    const anon = localStorage.getItem('anonymousMode') === '1'
    axios.get(`/api/posts?feed=user&user_id=${uid}`).then((res) => {
      const list = res.data.posts || []
      setPosts(list.filter((p: Post) => (anon ? p.anonymous : !p.anonymous)))
    })
    axios.get(`/api/users/${uid}/retweets`).then((res) => {
      const list = res.data.posts || []
      setRetweets(list.filter((p: Post) => (anon ? p.anonymous : !p.anonymous)))
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
      {user && (
        <div className="mb-6">
          <div className="h-32 bg-pink-200 rounded-t-lg relative" />
          <div className="px-4 -mt-10 flex items-end gap-4">
            {user.profile?.profile_image && (
              <img
                src={user.profile.profile_image}
                alt="icon"
                className="w-20 h-20 rounded-full border-2 border-white"
              />
            )}
            <div>
              <h1 className="text-xl font-bold">{user.username || user.user_id}</h1>
              {user.profile?.bio && <p className="text-sm mt-1">{user.profile.bio}</p>}
            </div>
          </div>
        </div>
      )}
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
