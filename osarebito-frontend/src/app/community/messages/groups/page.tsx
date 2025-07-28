'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { createGroupUrl, userGroupsUrl } from '@/routes'

interface Group { id: number; name: string; members: string[] }

export default function GroupsIndex() {
  const [groups, setGroups] = useState<Group[]>([])
  const [name, setName] = useState('')
  const [members, setMembers] = useState('')
  const uid = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : ''

  const load = async () => {
    if (!uid) return
    const res = await axios.get(userGroupsUrl(uid))
    setGroups(res.data.groups || [])
  }

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    if (!uid || !name) return
    const m = members.split(',').map((s) => s.trim()).filter((s) => s)
    if (!m.includes(uid)) m.push(uid)
    await axios.post(createGroupUrl, { name, members: m })
    setName('')
    setMembers('')
    load()
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">グループチャット</h1>
      <div className="space-y-2">
        {groups.map((g) => (
          <div key={g.id} className="border rounded-lg bg-white p-3 shadow">
            <Link href={`/community/messages/groups/${g.id}`} className="underline text-pink-500">
              {g.name}
            </Link>
          </div>
        ))}
        {groups.length === 0 && <p>グループがありません。</p>}
      </div>
      <div className="mt-4 space-y-2">
        <h2 className="font-semibold">新規作成</h2>
        <input
          className="border rounded p-1 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="グループ名"
        />
        <input
          className="border rounded p-1 w-full"
          value={members}
          onChange={(e) => setMembers(e.target.value)}
          placeholder="メンバーのユーザーIDをカンマ区切りで入力"
        />
        <button className="bg-pink-500 hover:bg-pink-600 text-white rounded px-3 transition" onClick={create}>
          作成
        </button>
      </div>
    </div>
  )
}
