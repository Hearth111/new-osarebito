'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'next/navigation'
import Link from 'next/link'
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
  anonymous?: boolean
  best_answer_id?: number | null
  likes?: string[]
  retweets?: string[]
}

interface Comment {
  id: number
  post_id: number
  author_id: string
  content: string
  created_at: string
}

export default function PostCommentsPage() {
  const params = useParams() as { postId: string }
  const postId = Number(params.postId)
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [reportTarget, setReportTarget] = useState<
    | { type: 'post'; id: number }
    | { type: 'comment'; id: number }
    | null
  >(null)

  const load = async () => {
    const [postRes, commentRes] = await Promise.all([
      axios.get(`/api/posts/${postId}`),
      axios.get(`/api/posts/${postId}/comments`),
    ])
    setPost(postRes.data)
    setComments(commentRes.data.comments || [])
    const uid = localStorage.getItem('userId') || ''
    if (uid) {
      const res = await axios.get(`/api/users/${uid}/bookmarks`)
      setBookmarks(res.data.posts.map((p: Post) => p.id))
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  const submitComment = async () => {
    const author_id = localStorage.getItem('userId') || ''
    if (!author_id || !commentText) return
    await axios.post(`/api/posts/${postId}/comments`, {
      author_id,
      content: commentText,
    })
    setCommentText('')
    const res = await axios.get(`/api/posts/${postId}/comments`)
    setComments(res.data.comments || [])
  }

  const handleLike = async (liked: boolean) => {
    const user_id = localStorage.getItem('userId') || ''
    if (!user_id) return
    const url = liked
      ? `/api/posts/${postId}/unlike`
      : `/api/posts/${postId}/like`
    await axios.post(url, { user_id })
    const res = await axios.get(`/api/posts/${postId}`)
    setPost(res.data)
  }

  const handleRetweet = async (rted: boolean) => {
    const user_id = localStorage.getItem('userId') || ''
    if (!user_id) return
    const url = rted
      ? `/api/posts/${postId}/unretweet`
      : `/api/posts/${postId}/retweet`
    await axios.post(url, { user_id })
    const res = await axios.get(`/api/posts/${postId}`)
    setPost(res.data)
  }

  const handleBookmark = async (marked: boolean) => {
    const user_id = localStorage.getItem('userId') || ''
    if (!user_id) return
    const url = marked
      ? `/api/posts/${postId}/unbookmark`
      : `/api/posts/${postId}/bookmark`
    await axios.post(url, { user_id })
    setBookmarks((b) => (marked ? b.filter((id) => id !== postId) : [...b, postId]))
  }

  if (!post) return <p className="p-4">Loading...</p>

  const liked = (post.likes || []).includes(localStorage.getItem('userId') || '')
  const rted = (post.retweets || []).includes(localStorage.getItem('userId') || '')
  const marked = bookmarks.includes(postId)

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <Link href="/community" className="underline text-sm">
        &larr; 戻る
      </Link>
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="text-sm text-gray-600">{post.author_id}</div>
        {post.category && (
          <div className="text-xs text-pink-600 mb-1">[{post.category}]</div>
        )}
        <p>{post.content}</p>
        <div className="mt-2 flex gap-4 text-sm items-center">
          <button className="flex items-center gap-1 underline" onClick={() => handleLike(liked)}>
            {liked ? (
              <HeartIconSolid className="w-4 h-4 text-red-500" />
            ) : (
              <HeartIcon className="w-4 h-4" />
            )}
            {post.likes ? post.likes.length : 0}
          </button>
          <button className="flex items-center gap-1 underline" onClick={() => handleRetweet(rted)}>
            <ArrowsRightLeftIcon className={`w-4 h-4 ${rted ? 'text-blue-500' : ''}`} />
            {post.retweets ? post.retweets.length : 0}
          </button>
          <button className="flex items-center gap-1 underline" onClick={() => handleBookmark(marked)}>
            <BookmarkIcon className={`w-4 h-4 ${marked ? 'text-green-500' : ''}`} />
          </button>
          <button
            className="underline text-sm"
            onClick={() => setReportTarget({ type: 'post', id: postId })}
          >
            通報
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg bg-white p-2 shadow text-sm">
            <span className="text-gray-600 mr-2">{c.author_id}</span>
            {c.content}
            <button
              className="ml-2 text-xs underline"
              onClick={() => setReportTarget({ type: 'comment', id: c.id })}
            >
              通報
            </button>
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          <input
            className="rounded flex-1 p-1 text-sm bg-white shadow"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="コメントする"
          />
          <button
            className="bg-pink-500 hover:bg-pink-600 text-white rounded px-2 transition"
            onClick={submitComment}
          >
            送信
          </button>
        </div>
      </div>
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
