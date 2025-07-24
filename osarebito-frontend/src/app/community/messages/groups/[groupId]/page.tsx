'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { groupMessagesUrl } from '@/routes'

interface Message { id: number; group_id: number; sender_id: string; content: string; created_at: string }

export default function GroupChat() {
  const params = useParams() as { groupId: string }
  const gid = parseInt(params.groupId)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : ''

  const load = async () => {
    const res = await axios.get(groupMessagesUrl(gid))
    setMessages(res.data.messages || [])
  }

  useEffect(() => {
    load()
    const ws = new WebSocket(groupMessagesUrl(gid).replace(/^http/, 'ws').replace('/groups', '/ws/updates'))
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'group_message' && msg.group_id === gid) {
          setMessages((prev) => [...prev, msg.message])
        }
      } catch {}
    }
    return () => ws.close()
  }, [gid])

  const send = async () => {
    if (!uid || !text) return
    await axios.post(groupMessagesUrl(gid), { group_id: gid, sender_id: uid, content: text })
    setText('')
    load()
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-2">
      <h1 className="text-xl font-bold mb-2">グループ {gid}</h1>
      <div className="border p-2 h-64 overflow-y-auto space-y-1">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="mr-2 text-gray-600">{m.sender_id}:</span>
            {m.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input className="border flex-1 p-1" value={text} onChange={(e) => setText(e.target.value)} placeholder="メッセージ" />
        <button className="bg-pink-500 text-white px-3" onClick={send}>
          送信
        </button>
      </div>
    </div>
  )
}
