import { getCollabProfileUrl } from '../../../../routs'

async function getCollabProfile(userId: string) {
  const res = await fetch(getCollabProfileUrl(userId), { cache: 'no-store' })
  if (!res.ok) {
    return null
  }
  return res.json()
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function CollabProfile({ params }: any) {
  const profile = await getCollabProfile(params.userId)
  if (!profile || Object.keys(profile).length === 0) {
    return <div className="max-w-md mx-auto mt-10">コラボ用プロフィールがありません</div>
  }
  return (
    <div className="max-w-md mx-auto mt-10 flex flex-col gap-2">
      <h1 className="text-2xl font-bold mb-4">コラボ用プロフィール</h1>
      {profile.interests && <p className="mt-2">趣味・嗜好: {profile.interests}</p>}
      {profile.looking_for && (
        <p className="mt-2">募集内容: {profile.looking_for}</p>
      )}
      {profile.availability && (
        <p className="mt-2">可能な日時: {profile.availability}</p>
      )}
      {profile.visibility && (
        <p className="mt-2 text-sm text-gray-600">公開範囲: {profile.visibility}</p>
      )}
    </div>
  )
}
