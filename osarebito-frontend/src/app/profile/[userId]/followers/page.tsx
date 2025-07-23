import Link from 'next/link'
import { followersUrl } from '../../../../routs'
/* eslint-disable @typescript-eslint/no-explicit-any */

async function getFollowers(userId: string) {
  const res = await fetch(followersUrl(userId), { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function FollowersPage({ params }: any) {
  const followers = await getFollowers(params.userId)
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">フォロワー</h1>
      {followers.length === 0 ? (
        <p>フォロワーはいません</p>
      ) : (
        <ul className="list-disc pl-5">
          {followers.map((u: any) => (
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
