'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  approvalCalendarsUrl,
  userCalendarsUrl,
  calendarRequestUrl,
  calendarApproveUrl,
} from '@/routes'

interface Slot {
  id?: number
  time: string
  capacity: number
  requests?: string[]
  approved?: string[]
}

interface Calendar {
  id: number
  author_id: string
  slots: Slot[]
}

export default function ApprovalCalendarPage() {
  const [slots, setSlots] = useState<Slot[]>([{ time: '', capacity: 1 }])
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : ''

  const load = async () => {
    if (!uid) return
    const res = await axios.get(userCalendarsUrl(uid))
    setCalendars(res.data.calendars || [])
  }

  useEffect(() => {
    load()
  }, [])

  const addSlot = () => setSlots([...slots, { time: '', capacity: 1 }])
  const updateSlot = (i: number, field: keyof Slot, value: string | number) => {
    const copy = [...slots]
    copy[i] = { ...copy[i], [field]: value }
    setSlots(copy)
  }
  const create = async () => {
    if (!uid) return
    await axios.post(approvalCalendarsUrl, { author_id: uid, slots })
    setSlots([{ time: '', capacity: 1 }])
    load()
  }

  const requestSlot = async (cid:number, sid:number) => {
    if (!uid) return
    await axios.post(calendarRequestUrl(cid), { user_id: uid, slot_id: sid })
    load()
  }

  const approveSlot = async (cid:number, sid:number, requester:string) => {
    if (!uid) return
    await axios.post(calendarApproveUrl(cid), {
      user_id: uid,
      slot_id: sid,
      requester_id: requester,
    })
    load()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">承認式カレンダー</h1>
      <div className="space-y-2 border rounded-lg bg-white p-3 shadow">
        {slots.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="border p-1 flex-1"
              placeholder="日時"
              value={s.time}
              onChange={(e) => updateSlot(i, 'time', e.target.value)}
            />
            <input
              className="border p-1 w-20"
              type="number"
              value={s.capacity}
              onChange={(e) => updateSlot(i, 'capacity', Number(e.target.value))}
            />
          </div>
        ))}
        <button className="bg-gray-200 py-1" onClick={addSlot}>
          行を追加
        </button>
        <button className="bg-pink-500 text-white py-2" onClick={create}>
          登録
        </button>
      </div>
      <div className="space-y-4">
        {calendars.map((c) => (
          <div key={c.id} className="border rounded-lg bg-white p-4 shadow space-y-2">
            <div className="font-semibold">{c.author_id}</div>
            {c.slots.map((s) => (
              <div key={s.id} className="border p-2 rounded">
                <div>
                  {s.time} 定員{s.capacity}
                </div>
                <div className="text-sm">承認済み: {s.approved?.join(', ') || 'なし'}</div>
                {uid === c.author_id ? (
                  <div className="space-y-1">
                    {s.requests && s.requests.length > 0 ? (
                      s.requests.map((r) => (
                        <button
                          key={r}
                          className="text-xs underline text-pink-500 mr-2"
                          onClick={() => approveSlot(c.id, s.id || 0, r)}
                        >
                          {r}を承認
                        </button>
                      ))
                    ) : (
                      <div className="text-xs">リクエストなし</div>
                    )}
                  </div>
                ) : (
                  <button
                    className="text-xs underline text-pink-500"
                    onClick={() => requestSlot(c.id, s.id || 0)}
                  >
                    予約リクエスト
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
