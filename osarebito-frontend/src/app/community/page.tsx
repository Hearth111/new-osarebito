'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { updatesWsUrl, bestAnswerUrl } from '@/routes'
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowsRightLeftIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline'

interface Post {
  id: number
  author_id: string
  content: string
  created_at: string
  tags: string[]
  category?: string | null
  anonymous?: boolean
  best_answer_id?: number | null
  likes?: string[]
  retweets?: string[]
}

interface User {
  user_id: string
  username: string
}

interface Comment {
  id: number
  post_id: number
  author_id: string
  content: string
  created_at: string
}

export default function CommunityHome() {
  const [feed, setFeed] = useState('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [recoUsers, setRecoUsers] = useState<User[]>([])
  const [tags, setTags] = useState<{ name: string; count: number }[]>([])
  const [newPost, setNewPost] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [commentText, setCommentText] = useState<Record<number, string>>({})
  const [showComments, setShowComments] = useState<Record<number, boolean>>({})
  const [bookmarks, setBookmarks] = useState<number[]>([])

  useEffect(() => {
    const ws = new WebSocket(updatesWsUrl)
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'new_post') {
          setPosts((p) => [msg.post, ...p])
        } else if (msg.type === 'like') {
          setPosts((p) =>
            p.map((post) =>
              post.id === msg.post_id ? { ...post, likes: msg.likes } : post,
            ),
          )
        } else if (msg.type === 'retweet') {
          setPosts((p) =>
            p.map((post) =>
              post.id === msg.post_id ? { ...post, retweets: msg.retweets } : post,
            ),
          )
        }
      } catch {
        // ignore
      }
    }
    return () => ws.close()
  }, [])

  const fetchPosts = async (f: string) => {
    const params = new URLSearchParams({ feed: f })
    if (category) params.append('category', category)
    const userId = localStorage.getItem('userId') || ''
    if (userId) params.append('user_id', userId)
    const res = await axios.get(`/api/posts?${params.toString()}`)
    setPosts(res.data.posts || [])
  }

  useEffect(() => {
    fetchPosts(feed)
  }, [feed, category])

  useEffect(() => {
    const loadSide = async () => {
      const u = await axios.get('/api/recommended_users')
      setRecoUsers(u.data)
      const t = await axios.get('/api/popular_tags')
      setTags(t.data)
    }
    loadSide()
    const uid = localStorage.getItem('userId') || ''
    if (uid) {
      axios.get(`/api/users/${uid}/bookmarks`).then((res) => {
        setBookmarks(res.data.posts.map((p: Post) => p.id))
      })
    }
  }, [])

  const submitPost = async () => {
    const author_id = localStorage.getItem('userId') || ''
    if (!author_id || !newPost) return
    await axios.post('/api/posts', { author_id, content: newPost, category: newCategory || null, anonymous })
    setNewPost('')
    setNewCategory('')
    setAnonymous(false)
    fetchPosts(feed)
  }

  const handleLike = async (postId: number, liked: boolean) => {
    const user_id = localStorage.getItem('userId') || ''
    if (!user_id) return
    const url = liked ? `/api/posts/${postId}/unlike` : `/api/posts/${postId}/like`
    await axios.post(url, { user_id })
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              likes: liked
                ? (p.likes || []).filter((v) => v !== user_id)
                : [...(p.likes || []), user_id],
            }
          : p,
      ),
    )
  }

  const handleRetweet = async (postId: number, rted: boolean) => {
    const user_id = localStorage.getItem('userId') || ''
    if (!user_id) return
    const url = rted
      ? `/api/posts/${postId}/unretweet`
      : `/api/posts/${postId}/retweet`
    await axios.post(url, { user_id })
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              retweets: rted
                ? (p.retweets || []).filter((v) => v !== user_id)
                : [...(p.retweets || []), user_id],
            }
          : p,
      ),
    )
  }

  const handleBookmark = async (postId: number, marked: boolean) => {
    const user_id = localStorage.getItem('userId') || ''
    if (!user_id) return
    const url = marked
      ? `/api/posts/${postId}/unbookmark`
      : `/api/posts/${postId}/bookmark`
    await axios.post(url, { user_id })
    setBookmarks((b) =>
      marked ? b.filter((id) => id !== postId) : [...b, postId],
    )
  }

  const loadComments = async (postId: number) => {
    const res = await axios.get(`/api/posts/${postId}/comments`)
    setComments((c) => ({ ...c, [postId]: res.data.comments || [] }))
  }

  const submitComment = async (postId: number) => {
    const author_id = localStorage.getItem('userId') || ''
    const content = commentText[postId]
    if (!author_id || !content) return
    await axios.post(`/api/posts/${postId}/comments`, { author_id, content })
    setCommentText((t) => ({ ...t, [postId]: '' }))
    loadComments(postId)
  }

  const toggleBest = async (postId: number, commentId: number) => {
    const user_id = localStorage.getItem('userId') || ''
    if (!user_id) return
    const res = await axios.put(bestAnswerUrl(postId), { comment_id: commentId, user_id })
    setPosts((p) =>
      p.map((post) =>
        post.id === postId ? { ...post, best_answer_id: res.data.best_answer_id } : post,
      ),
    )
  }

  const reportPost = async (postId: number) => {
    const reporter_id = localStorage.getItem('userId') || ''
    if (!reporter_id) return
    const reason = window.prompt('通報理由を入力してください') || ''
    await axios.post(`/api/reports/post/${postId}`, { reporter_id, reason })
    alert('通報しました')
  }

  const reportComment = async (commentId: number) => {
    const reporter_id = localStorage.getItem('userId') || ''
    if (!reporter_id) return
    const reason = window.prompt('通報理由を入力してください') || ''
    await axios.post(`/api/reports/comment/${commentId}`, { reporter_id, reason })
    alert('通報しました')
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
          <select className="border" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">カテゴリ指定なし</option>
            <option value="お悩み相談">お悩み相談</option>
            <option value="コラボ募集">コラボ募集</option>
            <option value="雑談">雑談</option>
          </select>
        </div>
        <div className="mb-4 flex gap-2">
          <textarea
            className="border p-2 flex-1"
            rows={3}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="いまどうしてる？"
          />
          <select className="border" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
            <option value="">カテゴリなし</option>
            <option value="お悩み相談">お悩み相談</option>
            <option value="コラボ募集">コラボ募集</option>
            <option value="雑談">雑談</option>
          </select>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            匿名
          </label>
          <button className="bg-pink-500 text-white px-4" onClick={submitPost}>
            投稿
          </button>
        </div>
        {posts.map((p) => (
          <div key={p.id} id={`post-${p.id}`} className="border p-3 mb-3">
            <div className="text-sm text-gray-600">{p.author_id}</div>
            {p.category && (
              <div className="text-xs text-pink-600 mb-1">[{p.category}]</div>
            )}
            <p>{p.content}</p>
            {p.tags && p.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-pink-600">
                {p.tags.map((t) => (
                  <span key={t}>#{t}</span>
                ))}
              </div>
            )}
            <div className="mt-2 flex gap-4 text-sm items-center">
              <button
                className="flex items-center gap-1 underline"
                onClick={() =>
                  handleLike(
                    p.id,
                    (p.likes || []).includes(
                      localStorage.getItem('userId') || '',
                    ),
                  )
                }
              >
                <HeartIcon className="w-4 h-4" />
                {p.likes ? p.likes.length : 0}
              </button>
              <button
                className="flex items-center gap-1 underline"
                onClick={() => {
                  const show = showComments[p.id]
                  if (!show) loadComments(p.id)
                  setShowComments((s) => ({ ...s, [p.id]: !show }))
                }}
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                {comments[p.id]?.length || 0}
              </button>
              <button
                className="flex items-center gap-1 underline"
                onClick={() =>
                  handleRetweet(
                    p.id,
                    (p.retweets || []).includes(
                      localStorage.getItem('userId') || '',
                    ),
                  )
                }
              >
                <ArrowsRightLeftIcon className="w-4 h-4" />
                {p.retweets ? p.retweets.length : 0}
              </button>
              <button
                className="flex items-center gap-1 underline"
                onClick={() => handleBookmark(p.id, bookmarks.includes(p.id))}
              >
                <BookmarkIcon className="w-4 h-4" />
              </button>
              <button className="underline" onClick={() => reportPost(p.id)}>
                通報
              </button>
            </div>
            {showComments[p.id] && (
              <div className="mt-2 space-y-2">
                {(comments[p.id] || []).map((c) => (
                  <div
                    key={c.id}
                    className={`border-t pt-1 text-sm ${p.best_answer_id === c.id ? 'bg-yellow-50' : ''}`}
                  >
                  <span className="text-gray-600 mr-2">{c.author_id}</span>
                  {c.content}
                  {p.best_answer_id === c.id && (
                    <span className="ml-2 text-xs text-red-500">ベストアンサー</span>
                  )}
                  {p.author_id === (typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '') && (
                    <button
                      className="ml-2 text-xs underline"
                      onClick={() => toggleBest(p.id, c.id)}
                    >
                      {p.best_answer_id === c.id ? '取り消し' : 'ベスト'}
                    </button>
                  )}
                  <button className="ml-2 text-xs underline" onClick={() => reportComment(c.id)}>
                    通報
                  </button>
                </div>
                ))}
                <div className="flex gap-2">
                  <input
                    className="border flex-1 p-1 text-sm"
                    value={commentText[p.id] || ''}
                    onChange={(e) =>
                      setCommentText((t) => ({ ...t, [p.id]: e.target.value }))
                    }
                    placeholder="コメントする"
                  />
                  <button
                    className="bg-pink-500 text-white px-2"
                    onClick={() => submitComment(p.id)}
                  >
                    送信
                  </button>
                </div>
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
