'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  HeartIcon,
  ArrowsRightLeftIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import ReportModal from '@/components/ReportModal'

interface Post {
  id: number
  author_id: string
  content: string
  created_at: string
  category?: string | null
  likes?: string[]
  retweets?: string[]
}

export default function CommunityBookmarks() {
  const [posts, setPosts] = useState<Post[]>([])
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [reportTarget, setReportTarget] = useState<
    | { type: 'post'; id: number }
    | { type: 'comment'; id: number }
    | null
  >(null)

  useEffect(() => {
    const uid = localStorage.getItem('userId') || ''
    if (!uid) return
    axios.get(`/api/users/${uid}/bookmarks`).then((res) => {
      const list = res.data.posts || []
      setPosts(list)
      setBookmarks(list.map((p: Post) => p.id))
    })
  }, [])

  const handleLike = async (postId: number, liked: boolean) => {
    const user_id = localStorage.getItem('userId') || ''
    if (!user_id) return
    const url = liked
      ? `/api/posts/${postId}/unlike`
      : `/api/posts/${postId}/like`
    await axios.post(url, { user_id })
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        const list = p.likes || []
        return {
          ...p,
          likes: liked ? list.filter((v) => v !== user_id) : [...list, user_id],
        }
      }),
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
    setBookmarks((b) => (marked ? b.filter((id) => id !== postId) : [...b, postId]))
  }

  const openReport = (id: number) => {
    setReportTarget({ type: 'post', id })
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">ブックマーク一覧</h1>
      {posts.map((p) => {
        const liked = (p.likes || []).includes(localStorage.getItem('userId') || '')
        const rted = (p.retweets || []).includes(localStorage.getItem('userId') || '')
        const marked = bookmarks.includes(p.id)
        return (
          <div key={p.id} className="border rounded-lg bg-white p-4 shadow mb-3">
            <div className="text-sm text-gray-600">{p.author_id}</div>
            {p.category && (
              <div className="text-xs text-pink-600 mb-1">[{p.category}]</div>
            )}
            <p>{p.content}</p>
            <div className="mt-2 flex gap-4 text-sm items-center">
              <button className="flex items-center gap-1 underline" onClick={() => handleLike(p.id, liked)}>
                {liked ? <HeartIconSolid className="w-4 h-4 text-red-500" /> : <HeartIcon className="w-4 h-4" />}
                {p.likes ? p.likes.length : 0}
              </button>
              <button className="flex items-center gap-1 underline" onClick={() => handleRetweet(p.id, rted)}>
                <ArrowsRightLeftIcon className={`w-4 h-4 ${rted ? 'text-blue-500' : ''}`} />
                {p.retweets ? p.retweets.length : 0}
              </button>
              <button className="flex items-center gap-1 underline" onClick={() => handleBookmark(p.id, marked)}>
                <BookmarkIcon className={`w-4 h-4 ${marked ? 'text-green-500' : ''}`} />
              </button>
              <button className="underline text-xs" onClick={() => openReport(p.id)}>
                通報
              </button>
            </div>
          </div>
        )
      })}
      {posts.length === 0 && <p>ブックマークはありません。</p>}
      {reportTarget && (
        <ReportModal
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  )
}
