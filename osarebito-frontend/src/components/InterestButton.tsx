'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface Props {
  targetId: string
  interested: string[]
}

export default function InterestButton({ targetId, interested }: Props) {
  const [ready, setReady] = useState(false)
  const [state, setState] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const myId = localStorage.getItem('userId') || ''
    if (myId) {
      setState(interested.includes(myId))
    }
    setReady(true)
  }, [interested])

  const handleClick = async () => {
    const myId = localStorage.getItem('userId') || ''
    if (!myId || myId === targetId) return
    try {
      const payload = { user_id: myId }
      if (state) {
        await axios.post(`/api/users/${targetId}/uninterest`, payload)
      } else {
        await axios.post(`/api/users/${targetId}/interest`, payload)
      }
      setState(!state)
      router.refresh()
    } catch {
      // ignore
    }
  }

  if (!ready) return null
  return (
    <button className="bg-gray-500 text-white px-4 py-1" onClick={handleClick}>
      {state ? '気になる済み' : '気になる'}
    </button>
  )
}
