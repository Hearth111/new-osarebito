'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function MutualLink({ targetId }: { targetId: string }) {
  const [myId, setMyId] = useState('')
  useEffect(() => {
    const id = localStorage.getItem('userId') || ''
    setMyId(id)
  }, [])
  if (!myId) return null
  return (
    <Link href={`/profile/${targetId}/mutual?my_id=${myId}`} className="underline">
      知り合いのフォロワー
    </Link>
  )
}
