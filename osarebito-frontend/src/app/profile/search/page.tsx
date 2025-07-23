'use client'
import { useState } from 'react'
import axios from 'axios'
import Link from 'next/link'

interface SearchUser {
  user_id: string
  username: string
}

export default function ProfileSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchUser[]>([])

  const handleSearch = async () => {
    const res = await axios.get('/api/users/search', { params: { query } })
    setResults(res.data)
  }

  return (
    <div className="max-w-md mx-auto mt-10 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">ユーザー検索</h1>
      <input
        className="border p-2"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users"
      />
      <button className="bg-blue-500 text-white py-2" onClick={handleSearch}>
        Search
      </button>
      <ul className="list-disc pl-5">
        {results.map((u) => (
          <li key={u.user_id}>
            <Link href={`/profile/${u.user_id}`} className="text-blue-500 underline">
              {u.username} ({u.user_id})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
