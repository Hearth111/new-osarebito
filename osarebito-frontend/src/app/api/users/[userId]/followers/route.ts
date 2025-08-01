import { NextRequest, NextResponse } from 'next/server'
import { followersUrl } from '@/routes'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId
    const res = await fetch(followersUrl(userId))
    const body = await res.json()
    if (!res.ok) {
      return NextResponse.json({ detail: body.detail }, { status: res.status })
    }
    return NextResponse.json(body)
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
