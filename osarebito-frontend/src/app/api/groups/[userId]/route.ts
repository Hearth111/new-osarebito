import { NextRequest, NextResponse } from 'next/server'
import { userGroupsUrl } from '@/routes'

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const res = await fetch(userGroupsUrl(params.userId))
    const body = await res.json()
    if (!res.ok) {
      return NextResponse.json({ detail: body.detail }, { status: res.status })
    }
    return NextResponse.json(body)
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
