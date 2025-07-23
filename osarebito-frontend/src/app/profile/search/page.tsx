'use client'
import { useState } from 'react'

interface SearchResult {
  user_id: string
  username: string
}
import Link from 'next/link'

export default function ProfileSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [message, setMessage] = useState('')

  const handleSearch = async () => {
    if (!query) return
    try {
      const res = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.detail || 'Error')
        setResults([])
      } else {
        setResults(data)
        setMessage('')
      }
    } catch {
      setMessage('Error')
      setResults([])
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">ユーザー検索</h1>
      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          type="text"
          placeholder="検索ワード"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="bg-pink-500 text-white px-4" onClick={handleSearch}>
          検索
        </button>
      </div>
      {message && <p>{message}</p>}
      {results.length > 0 && (
        <ul className="list-disc pl-5">
          {results.map((u) => (
            <li key={u.user_id} className="mt-2">
              <Link href={`/profile/${u.user_id}`} className="text-pink-500 underline">
                {u.username}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
