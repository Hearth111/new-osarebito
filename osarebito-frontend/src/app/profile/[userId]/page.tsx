import Image from 'next/image'

async function getUser(userId: string) {
  const res = await fetch(`http://localhost:3000/api/users/${userId}`, { cache: 'no-store' })
  if (!res.ok) {
    return null
  }
  return res.json()
}

export default async function Profile({ params }: { params: { userId: string } }) {
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
    </div>
  )
}
