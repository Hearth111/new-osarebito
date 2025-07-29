'use client'
import { useState } from 'react'
import axios from 'axios'
import { reportPostUrl, reportCommentUrl } from '@/routes'

interface Props {
  targetType: 'post' | 'comment'
  targetId: number
  onClose: () => void
}

export default function ReportModal({ targetType, targetId, onClose }: Props) {
  const [category, setCategory] = useState('スパム・広告')
  const [reason, setReason] = useState('')

  const submit = async () => {
    const reporter_id = localStorage.getItem('userId') || ''
    if (!reporter_id) return
    const url =
      targetType === 'post'
        ? reportPostUrl(targetId)
        : reportCommentUrl(targetId)
    await axios.post(url, { reporter_id, category, reason })
    onClose()
    alert('通報しました')
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded shadow w-72">
        <h3 className="font-bold mb-2">通報</h3>
        <select
          className="border rounded w-full p-1 mb-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="スパム・広告">スパム・広告</option>
          <option value="迷惑行為">迷惑行為</option>
          <option value="不適切なコンテンツ">不適切なコンテンツ</option>
          <option value="その他">その他</option>
        </select>
        <textarea
          className="border rounded w-full p-1 mb-2"
          rows={3}
          placeholder="詳細(任意)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button className="px-2 py-1 text-sm" onClick={onClose}>
            キャンセル
          </button>
          <button
            className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded text-sm"
            onClick={submit}
          >
            送信
          </button>
        </div>
      </div>
    </div>
  )
}
