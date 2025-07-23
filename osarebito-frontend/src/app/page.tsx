'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    setLoggedIn(localStorage.getItem('loggedIn') === 'true')
    setUserId(localStorage.getItem('userId') || '')
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('loggedIn')
    localStorage.removeItem('userId')
    setLoggedIn(false)
    setUserId('')
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Top Page</h1>
      {loggedIn ? (
        <div>
          <p>You are logged in.</p>
          <button
            className="bg-pink-500 text-white py-2 px-4 mt-4"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      ) : (
        <div>
          <p>You are not logged in.</p>
          <Link href="/login" className="text-pink-500 underline">
            Login
          </Link>
        </div>
      )}
      <div className="mt-4">
        <Link href="/imagetool" className="text-pink-500 underline">
          画像圧縮ツール
        </Link>
      </div>
      <div className="mt-2">
        <Link href="/profile/search" className="text-pink-500 underline">
          ユーザー検索
        </Link>
      </div>
      {loggedIn && (
        <>
          <div className="mt-2">
            <Link href={`/profile/${userId}`} className="text-pink-500 underline">
              プロフィール
            </Link>
          </div>
          <div className="mt-2">
            <Link href="/profile/settings" className="text-pink-500 underline">
              プロフィール設定
            </Link>
          </div>
          <div className="mt-2">
            <Link href="/profile/collab-settings" className="text-pink-500 underline">
              コラボ用プロフィール設定
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
