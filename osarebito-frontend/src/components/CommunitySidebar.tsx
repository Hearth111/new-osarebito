'use client'
import Link from 'next/link'
import {
  ChatBubbleLeftRightIcon,
  HashtagIcon,
  BellIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  SparklesIcon,
  UserGroupIcon,
  UserIcon,
  EyeSlashIcon,
  BookmarkIcon,
  PaintBrushIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

export default function CommunitySidebar() {
  const [showTutorial, setShowTutorial] = useState(false)
  const [anonMode, setAnonMode] = useState(false)

  useEffect(() => {
    const uid = localStorage.getItem('userId') || ''
    if (!uid) return
    fetch(`/api/users/${uid}/tutorial_tasks`)
      .then((res) => res.json())
      .then((data) => {
        setShowTutorial((data.tasks || []).length > 0)
      })
    setAnonMode(localStorage.getItem('anonymousMode') === '1')
  }, [])

  return (
    <nav className="w-48 bg-pink-100 min-h-screen p-4 space-y-4 border-r border-pink-200">
      <h2 className="text-lg font-semibold text-pink-700">コミュニティ</h2>
      <Link href="/community" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <ChatBubbleLeftRightIcon className="w-5 h-5" />
        <span>タイムライン</span>
      </Link>
      <Link href="/community/trends" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <HashtagIcon className="w-5 h-5" />
        <span>トレンド</span>
      </Link>
      <Link href="/community/notifications" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <BellIcon className="w-5 h-5" />
        <span>通知</span>
      </Link>
      <Link href="/community/messages" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <EnvelopeIcon className="w-5 h-5" />
        <span>メッセージ</span>
      </Link>
      <Link href="/community/groups" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <UserGroupIcon className="w-5 h-5" />
        <span>グループ</span>
      </Link>
      <Link href="/community/bookmarks" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <BookmarkIcon className="w-5 h-5" />
        <span>ブックマーク</span>
      </Link>
      <Link href="/community/mypage" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <UserIcon className="w-5 h-5" />
        <span>マイページ</span>
      </Link>
      <Link href="/community/jobs" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <BriefcaseIcon className="w-5 h-5" />
        <span>依頼掲示板</span>
      </Link>
      <Link href="/community/fan_posts" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <PaintBrushIcon className="w-5 h-5" />
        <span>ファン掲示板</span>
      </Link>
      <Link href="/community/materials" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <PhotoIcon className="w-5 h-5" />
        <span>素材マーケット</span>
      </Link>
      <Link href="/community/achievements" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <SparklesIcon className="w-5 h-5" />
        <span>実績</span>
      </Link>
      {showTutorial && (
        <Link href="/community/tutorial" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
          <SparklesIcon className="w-5 h-5" />
          <span>チュートリアル</span>
        </Link>
      )}
      <button
        className="flex items-center gap-2 text-pink-700 hover:text-pink-900"
        onClick={() => {
          if (anonMode) {
            localStorage.removeItem('anonymousMode')
          } else {
            localStorage.setItem('anonymousMode', '1')
          }
          setAnonMode(!anonMode)
          location.href = '/community'
        }}
      >
        <EyeSlashIcon className="w-5 h-5" />
        <span>{anonMode ? '通常モード' : '匿名モード'}</span>
      </button>
    </nav>
  )
}
