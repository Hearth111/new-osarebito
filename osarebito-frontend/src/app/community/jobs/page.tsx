'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { jobsUrl, updatesWsUrl } from '@/routes'

interface Job {
  id: number
  author_id: string
  title: string
  description: string
  reward?: string | null
  deadline?: string | null
  created_at: string
}

export default function CommunityJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reward, setReward] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    axios.get(jobsUrl).then((res) => setJobs(res.data.jobs || []))
    const ws = new WebSocket(updatesWsUrl)
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'new_job') {
          setJobs((j) => [msg.job, ...j])
        }
      } catch {
        // ignore
      }
    }
    return () => ws.close()
  }, [])

  const submit = async () => {
    const author_id = localStorage.getItem('userId') || ''
    if (!author_id || !title || !description) return
    await axios.post(jobsUrl, {
      author_id,
      title,
      description,
      reward: reward || null,
      deadline: deadline || null,
    })
    setTitle('')
    setDescription('')
    setReward('')
    setDeadline('')
    const res = await axios.get(jobsUrl)
    setJobs(res.data.jobs || [])
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">依頼掲示板</h1>
      <div className="space-y-2 border p-3">
        <input
          className="border p-1 w-full"
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="border p-1 w-full"
          rows={3}
          placeholder="依頼内容"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="border p-1 w-full"
          placeholder="報酬 (任意)"
          value={reward}
          onChange={(e) => setReward(e.target.value)}
        />
        <input
          className="border p-1 w-full"
          placeholder="締切 (任意)"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <button className="bg-pink-500 text-white px-3" onClick={submit}>
          投稿
        </button>
      </div>
      <div className="space-y-4">
        {jobs.map((j) => (
          <div key={j.id} className="border p-3">
            <div className="text-sm text-gray-600">{j.author_id}</div>
            <h2 className="font-semibold">{j.title}</h2>
            <p className="whitespace-pre-wrap">{j.description}</p>
            {j.reward && (
              <div className="text-sm text-gray-700">報酬: {j.reward}</div>
            )}
            {j.deadline && (
              <div className="text-sm text-gray-700">締切: {j.deadline}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
