'use client'
import { useState } from 'react'
import Image from 'next/image'

interface EventInput { date: string; title: string }

export default function SchedulePage() {
  const [events, setEvents] = useState<EventInput[]>([{ date: '', title: '' }])
  const [image, setImage] = useState('')
  const addEvent = () => setEvents([...events, { date: '', title: '' }])
  const update = (i: number, field: keyof EventInput, value: string) => {
    const copy = [...events]
    copy[i] = { ...copy[i], [field]: value }
    setEvents(copy)
  }
  const generate = async () => {
    const author_id = localStorage.getItem('userId') || ''
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_id, events }),
    })
    if (res.ok) {
      const data = await res.json()
      setImage(`data:image/png;base64,${data.image}`)
    }
  }
  return (
    <div className="max-w-md mx-auto mt-10 flex flex-col gap-2">
      <h1 className="text-2xl font-bold">予定表自動作成</h1>
      {events.map((ev, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="border p-1 flex-1"
            placeholder="YYYY-MM-DD"
            value={ev.date}
            onChange={(e) => update(i, 'date', e.target.value)}
          />
          <input
            className="border p-1 flex-1"
            placeholder="Title"
            value={ev.title}
            onChange={(e) => update(i, 'title', e.target.value)}
          />
        </div>
      ))}
      <button className="bg-gray-200 py-1" onClick={addEvent}>
        行を追加
      </button>
      <button className="bg-pink-500 text-white py-2" onClick={generate}>
        作成
      </button>
      {image && (
        <div className="mt-4">
          <Image src={image} alt="schedule" width={500} height={500} />
        </div>
      )}
    </div>
  )
}
