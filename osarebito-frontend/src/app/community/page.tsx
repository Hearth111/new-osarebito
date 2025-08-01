'use client'
import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import Link from 'next/link'
import PostCard from '@/components/PostCard'
import { updatesWsUrl, bestAnswerUrl } from '@/routes'
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ArrowsRightLeftIcon,
  BookmarkIcon,
  PhotoIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  TagIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import ReportModal from '../../components/ReportModal'

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
  image?: string | null
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
  const [postResults, setPostResults] = useState<Post[]>([])
  const [recoUsers, setRecoUsers] = useState<User[]>([])
  const [tags, setTags] = useState<{ name: string; count: number }[]>([])
  const [newPost, setNewPost] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showPollModal, setShowPollModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newImage, setNewImage] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [commentText, setCommentText] = useState<Record<number, string>>({})
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [reportTarget, setReportTarget] = useState<
    | { type: 'post'; id: number }
    | { type: 'comment'; id: number }
    | null
  >(null)

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
    if (localStorage.getItem('anonymousMode') === '1') {
      params.append('anonymous', 'true')
    } else {
      params.append('anonymous', 'false')
    }
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
    await axios.post('/api/posts', {
      author_id,
      content: newPost,
      category: newCategory || null,
      anonymous: localStorage.getItem('anonymousMode') === '1',
      image: newImage,
    })
    setNewPost('')
    setNewCategory('')
    setNewImage(null)
    fetchPosts(feed)
  }

  const handleLike = async (postId: number, liked: boolean) => {
    const user_id = localStorage.getItem('userId') || ''
    if (!user_id) return
    const url = liked ? `/api/posts/${postId}/unlike` : `/api/posts/${postId}/like`
    try {
      await axios.post(url, { user_id })
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p
          const list = p.likes || []
          let newLikes = list
          if (liked) {
            newLikes = list.filter((v) => v !== user_id)
          } else if (!list.includes(user_id)) {
            newLikes = [...list, user_id]
          }
          return { ...p, likes: newLikes }
        }),
      )
    } catch {
      // ignore
    }
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

  const openReport = (type: 'post' | 'comment', id: number) => {
    setReportTarget({ type, id })
  }

  const doSearch = async () => {
    if (!search) return
    if (search.startsWith('#')) {
      const tag = search.slice(1)
      const res = await axios.get(`/api/posts/by_tag?tag=${encodeURIComponent(tag)}`)
      setPostResults(res.data.posts || [])
      setResults([])
    } else {
      const res = await axios.get(`/api/users/search?query=${encodeURIComponent(search)}`)
      setResults(res.data)
      setPostResults([])
    }
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 max-w-2xl">
        <div className="mb-4 flex gap-2">
          <button
            className={`px-3 py-1 rounded-full transition-colors ${feed === 'all' && !category ? 'bg-pink-500 text-white' : 'hover:bg-pink-100'}`}
            onClick={() => {
              setFeed('all')
              setCategory('')
            }}
          >
            すべて
          </button>
          <button
            className={`px-3 py-1 rounded-full transition-colors ${feed === 'following' ? 'bg-pink-500 text-white' : 'hover:bg-pink-100'}`}
            onClick={() => {
              setFeed('following')
              setCategory('')
            }}
          >
            フォロー中
          </button>
          <button
            className={`px-3 py-1 rounded-full transition-colors ${category === '雑談' ? 'bg-pink-500 text-white' : 'hover:bg-pink-100'}`}
            onClick={() => {
              setFeed('all')
              setCategory('雑談')
            }}
          >
            雑談
          </button>
          <button
            className={`px-3 py-1 rounded-full transition-colors ${category === 'コラボ募集' ? 'bg-pink-500 text-white' : 'hover:bg-pink-100'}`}
            onClick={() => {
              setFeed('all')
              setCategory('コラボ募集')
            }}
          >
            コラボ募集
          </button>
          <button
            className={`px-3 py-1 rounded-full transition-colors ${category === 'お悩み相談' ? 'bg-pink-500 text-white' : 'hover:bg-pink-100'}`}
            onClick={() => {
              setFeed('all')
              setCategory('お悩み相談')
            }}
          >
            お悩み相談
          </button>
        </div>
        <div className="mb-6">
          <textarea
            className="rounded p-2 w-full bg-white shadow mb-2"
            rows={4}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="いまどうしてる？"
          />
          <div className="flex gap-2 items-center">
            <button onClick={() => fileInputRef.current?.click()} className="p-1 hover:bg-pink-100 rounded">
              <PhotoIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setShowPollModal(true)} className="p-1 hover:bg-pink-100 rounded">
              <ChartBarIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setShowScheduleModal(true)} className="p-1 hover:bg-pink-100 rounded">
              <CalendarDaysIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setShowCategoryModal(true)} className="p-1 hover:bg-pink-100 rounded">
              <TagIcon className="w-5 h-5" />
            </button>
            <button className="ml-auto bg-pink-500 hover:bg-pink-600 text-white rounded px-4 transition" onClick={submitPost}>
              投稿
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => setNewImage(reader.result as string)
                reader.readAsDataURL(file)
              }}
            />
          </div>
          {newImage && (
            <img src={newImage} alt="preview" className="max-h-40 mt-2" />
          )}
          {newCategory && (
            <div className="text-sm mt-1">カテゴリ: {newCategory}</div>
          )}
        </div>
        {posts.map((p) => (
          <PostCard
            key={p.id}
            author={p.author_id}
            category={p.category}
            content={p.content}
            image={p.image}
            createdAt={p.created_at}
            actions={
              <>
                <button
                  className="flex items-center gap-1 underline"
                  onClick={() =>
                    handleLike(
                      p.id,
                      (p.likes || []).includes(localStorage.getItem('userId') || '')
                    )
                  }
                >
                  {(p.likes || []).includes(localStorage.getItem('userId') || '') ? (
                    <HeartIconSolid className="w-4 h-4 text-red-500" />
                  ) : (
                    <HeartIcon className="w-4 h-4" />
                  )}
                  {p.likes ? p.likes.length : 0}
                </button>
                <Link
                  href={`/community/post/${p.id}`}
                  className="flex items-center gap-1 underline"
                >
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  {comments[p.id]?.length || 0}
                </Link>
                <button
                  className="flex items-center gap-1 underline"
                  onClick={() =>
                    handleRetweet(
                      p.id,
                      (p.retweets || []).includes(localStorage.getItem('userId') || '')
                    )
                  }
                >
                  <ArrowsRightLeftIcon
                    className={`w-4 h-4 ${(p.retweets || []).includes(localStorage.getItem('userId') || '') ? 'text-blue-500' : ''}`}
                  />
                  {p.retweets ? p.retweets.length : 0}
                </button>
                <button
                  className="flex items-center gap-1 underline"
                  onClick={() => handleBookmark(p.id, bookmarks.includes(p.id))}
                >
                  <BookmarkIcon
                    className={`w-4 h-4 ${bookmarks.includes(p.id) ? 'text-green-500' : ''}`}
                  />
                </button>
                <button className="underline" onClick={() => openReport('post', p.id)}>
                  通報
                </button>
              </>
            }
          >
            {p.tags && p.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-pink-600">
                {p.tags.map((t) => (
                  <span key={t}>#{t}</span>
                ))}
              </div>
            )}
          </PostCard>
        ))}
      </div>
      <div className="w-72 space-y-6 ml-auto">
        <div>
          <div className="flex gap-2 mb-2">
            <input
              className="rounded p-1 flex-1 bg-white shadow"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="投稿・ユーザー検索"
            />
            <button className="bg-pink-500 hover:bg-pink-600 text-white rounded px-2 transition" onClick={doSearch}>
              検索
            </button>
          </div>
          {postResults.length > 0 && (
            <ul className="text-sm pl-4 list-disc">
              {postResults.map((p) => (
                <li key={p.id} className="mt-1">
                  <Link href={`/community/post/${p.id}`} className="underline text-pink-500">
                    {p.content.slice(0, 20)}...
                  </Link>
                </li>
              ))}
            </ul>
          )}
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
      {reportTarget && (
        <ReportModal
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
        />
      )}
      {showCategoryModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded shadow w-60">
            <h3 className="font-bold mb-2">カテゴリ選択</h3>
            <select
              className="border rounded w-full p-1 mb-2"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              <option value="">なし</option>
              <option value="お悩み相談">お悩み相談</option>
              <option value="コラボ募集">コラボ募集</option>
              <option value="雑談">雑談</option>
            </select>
            <div className="text-right">
              <button
                className="bg-pink-500 hover:bg-pink-600 text-white rounded px-3 py-1 text-sm"
                onClick={() => setShowCategoryModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {showPollModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded shadow w-60 text-center space-y-2">
            <p>投票機能は準備中です</p>
            <button className="bg-pink-500 hover:bg-pink-600 text-white rounded px-3 py-1 text-sm" onClick={() => setShowPollModal(false)}>閉じる</button>
          </div>
        </div>
      )}
      {showScheduleModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded shadow w-60 text-center space-y-2">
            <p>予約機能は準備中です</p>
            <button className="bg-pink-500 hover:bg-pink-600 text-white rounded px-3 py-1 text-sm" onClick={() => setShowScheduleModal(false)}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  )
}
