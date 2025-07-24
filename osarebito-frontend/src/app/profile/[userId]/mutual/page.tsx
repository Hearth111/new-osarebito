import Link from 'next/link'
import { mutualFollowersUrl } from '@/routes'
/* eslint-disable @typescript-eslint/no-explicit-any */

async function getMutualFollowers(userId: string, myId: string) {
  const res = await fetch(mutualFollowersUrl(userId, myId), { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function MutualFollowers({ params, searchParams }: any) {
  const myId = searchParams?.my_id || ''
  const users = await getMutualFollowers(params.userId, myId)
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">知り合いのフォロワー</h1>
      {users.length === 0 ? (
        <p>知り合いのフォロワーはいません</p>
      ) : (
        <ul className="list-disc pl-5">
          {users.map((u: any) => (
            <li key={u.user_id} className="mt-2">
              <Link href={`/profile/${u.user_id}`} className="text-pink-500 underline">
                {u.username}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
