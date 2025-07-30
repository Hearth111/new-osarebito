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
import PostCard from '@/components/PostCard'

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

export default function PostCommentsPage() {
  const params = useParams() as { postId: string }
  const postId = Number(params.postId)
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [postResults, setPostResults] = useState<Post[]>([])
  const [recoUsers, setRecoUsers] = useState<User[]>([])
  const [tags, setTags] = useState<{ name: string; count: number }[]>([])
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
    const anonMode = localStorage.getItem('anonymousMode') === '1'
    const data = postRes.data
    if ((anonMode && !data.anonymous) || (!anonMode && data.anonymous)) {
      setPost(null)
      setComments([])
      return
    }
    setPost(data)
    setComments(commentRes.data.comments || [])
    const [u, t] = await Promise.all([
      axios.get('/api/recommended_users'),
      axios.get('/api/popular_tags'),
    ])
    setRecoUsers(u.data)
    setTags(t.data)
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

  if (!post)
    return (
      <p className="p-4">この投稿は現在のモードでは表示できません。</p>
    )

  const liked = (post.likes || []).includes(localStorage.getItem('userId') || '')
  const rted = (post.retweets || []).includes(localStorage.getItem('userId') || '')
  const marked = bookmarks.includes(postId)

  return (
    <div className="flex gap-6">
      <div className="flex-1 max-w-2xl p-4 space-y-4">
        <Link href="/community" className="underline text-sm">
          &larr; 戻る
        </Link>
        <PostCard
          author={post.author_id}
          category={post.category}
          content={post.content}
          image={post.image}
          createdAt={post.created_at}
          actions={
            <>
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
              <button className="underline text-sm" onClick={() => setReportTarget({ type: 'post', id: postId })}>
                通報
              </button>
            </>
          }
        />
        <div className="space-y-2">
          {comments.map((c) => (
              <PostCard
                key={c.id}
                author={c.author_id}
                content={c.content}
                createdAt={c.created_at}
                compact
                actions={
                  <button className="ml-2 text-xs underline" onClick={() => openReport('comment', c.id)}>
                    通報
                  </button>
                }
              />
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
    </div>
  )
}
