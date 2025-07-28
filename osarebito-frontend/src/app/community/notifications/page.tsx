'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface Notification {
  type: string
  from?: string
  message_id?: number
  created_at: string
}

export default function CommunityNotifications() {
  const [notes, setNotes] = useState<Notification[]>([])

  useEffect(() => {
    const uid = localStorage.getItem('userId') || ''
    if (!uid) return
    axios.get(`/api/users/${uid}/notifications`).then((res) => {
      setNotes(res.data.notifications || [])
    })
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">通知</h1>
      {notes.length === 0 ? (
        <p>通知はありません。</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n, idx) => (
            <li key={idx} className="text-sm border rounded-lg bg-white p-2 shadow">
              {n.type === 'message' && n.from ? (
                <span>{n.from} からメッセージが届きました。</span>
              ) : n.type === 'follow' && n.from ? (
                <span>{n.from} にフォローされました。</span>
              ) : (
                <span>{n.type}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
