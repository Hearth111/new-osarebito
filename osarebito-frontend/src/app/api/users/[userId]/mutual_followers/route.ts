import { NextRequest, NextResponse } from 'next/server'
import { mutualFollowersUrl } from '../../../../../routs'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const { searchParams } = new URL(req.url)
    const myId = searchParams.get('my_id') || ''
    const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId
    const res = await fetch(mutualFollowersUrl(userId, myId))
    const body = await res.json()
    if (!res.ok) {
      return NextResponse.json({ detail: body.detail }, { status: res.status })
    }
    return NextResponse.json(body)
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
