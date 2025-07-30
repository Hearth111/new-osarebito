'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface User {
  user_id: string
  username?: string
}

export default function CommunitySettings() {
  const [blocks, setBlocks] = useState<User[]>([])

  const load = async () => {
    const uid = localStorage.getItem('userId') || ''
    if (!uid) return
    const res = await axios.get(`/api/users/${uid}/blocks`)
    setBlocks(res.data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const unblock = async (targetId: string) => {
    const uid = localStorage.getItem('userId') || ''
    if (!uid) return
    await axios.post(`/api/users/${targetId}/unblock`, { user_id: uid })
    load()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">コミュニティ設定</h1>
      <div>
        <h2 className="font-semibold mb-2">ブロック中のユーザー</h2>
        <div className="space-y-2">
          {blocks.map((u) => (
            <div key={u.user_id} className="flex items-center justify-between border rounded-lg bg-white p-2 shadow">
              <span>{u.username || u.user_id}</span>
              <button
                className="bg-red-500 hover:bg-red-600 text-white rounded px-3"
                onClick={() => unblock(u.user_id)}
              >
                解除
              </button>
            </div>
          ))}
          {blocks.length === 0 && <p>ブロックしているユーザーはいません。</p>}
        </div>
      </div>
    </div>
  )
}
