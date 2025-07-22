'use client'
import { useState } from 'react'
import axios from 'axios'
import Link from 'next/link'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      setMessage('Please select a role')
      return
    }
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }
    try {
      const res = await axios.post('/api/register', {
        email,
        user_id: userId,
        username,
        password,
        role,
      })
      setMessage(res.data.message)
      setEmail('')
      setUserId('')
      setUsername('')
      setPassword('')
      setConfirmPassword('')
      setRole('')
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
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="border p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
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
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
        <input
          className="border p-2"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <div className="flex gap-4">
          {[
            { key: '推され人', label: '推され人' },
            { key: '推し人', label: '推し人' },
            { key: 'お仕事人', label: 'お仕事人' },
          ].map((r) => (
            <div
              key={r.key}
              className={`flex-1 border p-4 cursor-pointer rounded ${role === r.key ? 'bg-blue-100 border-blue-500' : ''}`}
              onClick={() => setRole(r.key)}
            >
              {r.label}
            </div>
          ))}
        </div>
        <button className="bg-blue-500 text-white py-2" type="submit">
          Register
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
      <div className="mt-4">
        <Link href="/login" className="text-blue-500 underline">
          Go to Login
        </Link>
      </div>
    </div>
  )
}
