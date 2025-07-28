'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { achievementsUrl } from '@/routes'

export default function CommunityAchievements() {
  const [achievements, setAchievements] = useState<string[]>([])

  useEffect(() => {
    const uid = localStorage.getItem('userId') || ''
    if (!uid) return
    axios.get(achievementsUrl(uid)).then((res) => {
      setAchievements(res.data.achievements || [])
    })
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">実績</h1>
      {achievements.length === 0 ? (
        <p>まだ実績はありません。</p>
      ) : (
        <ul className="space-y-2">
          {achievements.map((a) => (
            <li key={a} className="border rounded-lg bg-white p-2 shadow text-sm">
              {a}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
