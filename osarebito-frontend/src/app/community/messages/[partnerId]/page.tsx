'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { sendMessageUrl } from '../../../../routs'

interface Message {
  id: number
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

export default function MessagesWith() {
  const params = useParams() as { partnerId: string }
  const partnerId = params.partnerId
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')

  const myId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : ''

  const loadMessages = async () => {
    if (!myId) return
    const res = await axios.get(`/api/messages/${myId}/with/${partnerId}`)
    setMessages(res.data.messages || [])
  }

  useEffect(() => {
    loadMessages()
    const ws = new WebSocket(sendMessageUrl.replace(/^http/, 'ws').replace('/messages', '/ws/updates'))
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'new_message') {
          const m = msg.message as Message
          if (
            (m.sender_id === myId && m.receiver_id === partnerId) ||
            (m.sender_id === partnerId && m.receiver_id === myId)
          ) {
            setMessages((prev) => [...prev, m])
          }
        }
      } catch {
        // ignore
      }
    }
    return () => ws.close()
  }, [partnerId, myId])

  const send = async () => {
    if (!myId || !text) return
    await axios.post('/api/messages', {
      sender_id: myId,
      receiver_id: partnerId,
      content: text,
    })
    setText('')
    loadMessages()
  }

  return (
    <div className="p-4 max-w-md mx-auto space-y-2">
      <h1 className="text-xl font-bold mb-2">{partnerId}とのメッセージ</h1>
      <div className="border p-2 h-64 overflow-y-auto space-y-1">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="mr-2 text-gray-600">{m.sender_id}:</span>
            {m.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="border flex-1 p-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="メッセージを入力"
        />
        <button className="bg-pink-500 text-white px-3" onClick={send}>
          送信
        </button>
      </div>
    </div>
  )
}
