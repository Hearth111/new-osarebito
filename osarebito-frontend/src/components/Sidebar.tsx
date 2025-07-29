'use client'
import Link from 'next/link'
import {
  HomeIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

export default function Sidebar() {
  return (
    <nav className="w-48 bg-pink-50 min-h-screen p-4 space-y-4">
      <Link href="/" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <HomeIcon className="w-5 h-5" />
        <span>ホーム</span>
      </Link>
      <Link href="/login" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <ArrowRightOnRectangleIcon className="w-5 h-5" />
        <span>ログイン</span>
      </Link>
      <Link href="/signup" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <UserPlusIcon className="w-5 h-5" />
        <span>新規登録</span>
      </Link>
      <Link href="/imagetool" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <PhotoIcon className="w-5 h-5" />
        <span>画像圧縮</span>
      </Link>
      <Link href="/profile/search" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <MagnifyingGlassIcon className="w-5 h-5" />
        <span>ユーザー検索</span>
      </Link>
      <Link href="/site-settings" className="flex items-center gap-2 text-pink-700 hover:text-pink-900">
        <Cog6ToothIcon className="w-5 h-5" />
        <span>サイト設定</span>
      </Link>
    </nav>
  )
}
