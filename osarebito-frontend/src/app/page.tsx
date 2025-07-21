'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(localStorage.getItem('loggedIn') === 'true')
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('loggedIn')
    setLoggedIn(false)
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Top Page</h1>
      {loggedIn ? (
        <div>
          <p>You are logged in.</p>
          <button
            className="bg-blue-500 text-white py-2 px-4 mt-4"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      ) : (
        <div>
          <p>You are not logged in.</p>
          <Link href="/login" className="text-blue-500 underline">
            Login
          </Link>
        </div>
      )}
    </div>
  )
}
