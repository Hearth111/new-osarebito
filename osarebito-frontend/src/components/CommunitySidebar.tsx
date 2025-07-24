'use client'
import Link from 'next/link'
import {
  ChatBubbleLeftRightIcon,
  HashtagIcon,
  BellIcon,
} from '@heroicons/react/24/outline'

export default function CommunitySidebar() {
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
    </nav>
  )
}
