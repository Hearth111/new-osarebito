'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface Props {
  targetId: string
}

export default function BlockButton({ targetId }: Props) {
  const [ready, setReady] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const myId = localStorage.getItem('userId') || ''
    if (!myId) {
      setReady(true)
      return
    }
    axios.get(`/api/users/${myId}`).then((res) => {
      setBlocked((res.data.blocks || []).includes(targetId))
      setReady(true)
    })
  }, [targetId])

  const handleClick = async () => {
    const myId = localStorage.getItem('userId') || ''
    if (!myId || myId === targetId) return
    const payload = { user_id: myId }
    if (blocked) {
      await axios.post(`/api/users/${targetId}/unblock`, payload)
    } else {
      await axios.post(`/api/users/${targetId}/block`, payload)
    }
    setBlocked(!blocked)
    router.refresh()
  }

  if (!ready) return null
  return (
    <button className="bg-red-500 text-white px-4 py-1" onClick={handleClick}>
      {blocked ? 'ブロック解除' : 'ブロック'}
    </button>
  )
}
