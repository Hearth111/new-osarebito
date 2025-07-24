'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function CommunityTutorial() {
  const [tasks, setTasks] = useState<string[]>([])

  useEffect(() => {
    const uid = localStorage.getItem('userId') || ''
    if (!uid) return
    axios.get(`/api/users/${uid}/tutorial_tasks`).then((res) => {
      setTasks(res.data.tasks || [])
    })
  }, [])

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">チュートリアル</h1>
      {tasks.length === 0 ? (
        <p>チュートリアルタスクはありません。</p>
      ) : (
        <ul className="list-disc pl-6 space-y-1">
          {tasks.map((t, idx) => (
            <li key={idx}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
