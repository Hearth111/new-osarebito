'use client'
import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.post('/api/login', {
        user_id: userId,
        password,
      })
      if (res.status === 200) {
        localStorage.setItem('loggedIn', 'true')
        localStorage.setItem('userId', userId)
        setMessage('Logged in')
        router.push('/')
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const anyErr = err as { response?: { data?: { detail?: string } } }
        setMessage(anyErr.response?.data?.detail || 'Error')
      } else {
        setMessage('Error')
      }
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="border p-2"
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <input
          className="border p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="bg-blue-500 text-white py-2" type="submit">
          Login
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
      <div className="mt-4">
        <Link href="/signup" className="text-blue-500 underline">
          Go to Sign Up
        </Link>
      </div>
    </div>
  )
}
