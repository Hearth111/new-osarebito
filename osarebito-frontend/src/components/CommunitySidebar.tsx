'use client'
import Link from 'next/link'
import {
  ChatBubbleLeftRightIcon,
  HashtagIcon,
  BellIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

export default function CommunitySidebar() {
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    const uid = localStorage.getItem('userId') || ''
    if (!uid) return
    fetch(`/api/users/${uid}/tutorial_tasks`)
      .then((res) => res.json())
      .then((data) => {
        setShowTutorial((data.tasks || []).length > 0)
      })
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
        <span className="w-5 h-5">👥</span>
        <span>グループ</span>
      </Link>
      <Link href="/community/bookmarks" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <span className="w-5 h-5">🔖</span>
        <span>ブックマーク</span>
      </Link>
      <Link href="/community/jobs" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <BriefcaseIcon className="w-5 h-5" />
        <span>依頼掲示板</span>
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
    </nav>
  )
}
