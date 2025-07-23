import Link from 'next/link'
import { followingUrl } from '../../../../routs'
/* eslint-disable @typescript-eslint/no-explicit-any */

async function getFollowing(userId: string) {
  const res = await fetch(followingUrl(userId), { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function FollowingPage({ params }: any) {
  const following = await getFollowing(params.userId)
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">フォロー中</h1>
      {following.length === 0 ? (
        <p>フォローしているユーザーはいません</p>
      ) : (
        <ul className="list-disc pl-5">
          {following.map((u: any) => (
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
