'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'

interface Post {
  id: number
  author_id: string
  content: string
  created_at: string
  tags: string[]
}

interface User {
  user_id: string
  username: string
}

export default function CommunityHome() {
  const [feed, setFeed] = useState('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [recoUsers, setRecoUsers] = useState<User[]>([])
  const [tags, setTags] = useState<{ name: string; count: number }[]>([])
  const [newPost, setNewPost] = useState('')

  const fetchPosts = async (f: string) => {
    const params = new URLSearchParams({ feed: f })
    const userId = localStorage.getItem('userId') || ''
    if (userId) params.append('user_id', userId)
    const res = await axios.get(`/api/posts?${params.toString()}`)
    setPosts(res.data.posts || [])
  }

  useEffect(() => {
    fetchPosts(feed)
  }, [feed])

  useEffect(() => {
    const loadSide = async () => {
      const u = await axios.get('/api/recommended_users')
      setRecoUsers(u.data)
      const t = await axios.get('/api/popular_tags')
      setTags(t.data)
    }
    loadSide()
  }, [])

  const submitPost = async () => {
    const author_id = localStorage.getItem('userId') || ''
    if (!author_id || !newPost) return
    await axios.post('/api/posts', { author_id, content: newPost })
    setNewPost('')
    fetchPosts(feed)
  }

  const doSearch = async () => {
    if (!search) return
    const res = await axios.get(`/api/users/search?query=${encodeURIComponent(search)}`)
    setResults(res.data)
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1 max-w-2xl">
        <div className="mb-4 flex gap-2">
          <button
            className={`px-3 py-1 border ${feed === 'all' ? 'bg-pink-500 text-white' : ''}`}
            onClick={() => setFeed('all')}
          >
            すべて
          </button>
          <button
            className={`px-3 py-1 border ${feed === 'following' ? 'bg-pink-500 text-white' : ''}`}
            onClick={() => setFeed('following')}
          >
            フォロー中
          </button>
        </div>
        <div className="mb-4 flex gap-2">
          <textarea
            className="border p-2 flex-1"
            rows={3}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="いまどうしてる？"
          />
          <button className="bg-pink-500 text-white px-4" onClick={submitPost}>
            投稿
          </button>
        </div>
        {posts.map((p) => (
          <div key={p.id} className="border p-3 mb-3">
            <div className="text-sm text-gray-600">{p.author_id}</div>
            <p>{p.content}</p>
            {p.tags && p.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-pink-600">
                {p.tags.map((t) => (
                  <span key={t}>#{t}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="w-64 space-y-6">
        <div>
          <div className="flex gap-2 mb-2">
            <input
              className="border p-1 flex-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ユーザー検索"
            />
            <button className="bg-pink-500 text-white px-2" onClick={doSearch}>
              検索
            </button>
          </div>
          {results.length > 0 && (
            <ul className="text-sm pl-4 list-disc">
              {results.map((u) => (
                <li key={u.user_id} className="mt-1">
                  <Link href={`/profile/${u.user_id}`} className="underline text-pink-500">
                    {u.username || u.user_id}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="font-bold mb-2">おすすめユーザー</h3>
          <ul className="space-y-1">
            {recoUsers.map((u) => (
              <li key={u.user_id} className="text-sm">
                <Link href={`/profile/${u.user_id}`} className="underline text-pink-500">
                  {u.username}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-2">お気に入りタグ</h3>
          <div className="flex gap-2 flex-wrap text-sm">
            {tags.map((t) => (
              <span key={t.name} className="bg-pink-100 px-2 py-1">#{t.name}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
