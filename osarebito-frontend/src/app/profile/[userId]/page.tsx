import Image from 'next/image'
import Link from 'next/link'
import { getUserUrl } from '../../../routs'

async function getUser(userId: string) {
  const res = await fetch(getUserUrl(userId), { cache: 'no-store' })
  if (!res.ok) {
    return null
  }
  return res.json()
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function Profile({ params }: any) {
  const user = await getUser(params.userId)
  if (!user) {
    return <div className="max-w-md mx-auto mt-10">ユーザーが見つかりません</div>
  }
  const profile = user.profile || {}
  return (
    <div className="max-w-md mx-auto mt-10 flex flex-col gap-2">
      <h1 className="text-2xl font-bold mb-4">プロフィール</h1>
      <p>User ID: {user.user_id}</p>
      <p>Username: {user.username}</p>
      {profile.profile_image && (
        <Image src={profile.profile_image} alt="profile" width={200} height={200} className="mt-2" />
      )}
      {profile.bio && <p className="mt-2">{profile.bio}</p>}
      {profile.activity && <p className="mt-2">{profile.activity}</p>}
      {profile.sns_links && (
        <div className="mt-2 flex flex-col gap-1">
          {profile.sns_links.youtube && (
            <a href={profile.sns_links.youtube} className="text-pink-500 underline">
              YouTube
            </a>
          )}
          {profile.sns_links.twitter && (
            <a href={profile.sns_links.twitter} className="text-pink-500 underline">
              Twitter
            </a>
          )}
        </div>
      )}
      {profile.visibility && (
        <p className="mt-2 text-sm text-gray-600">公開範囲: {profile.visibility}</p>
      )}
      <div className="mt-2">
        <Link href={`/profile/${params.userId}/collab`} className="text-pink-500 underline">
          コラボ用プロフィールを見る
        </Link>
      </div>
    </div>
  )
}
