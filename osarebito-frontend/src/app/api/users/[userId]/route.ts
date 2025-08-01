import { NextRequest, NextResponse } from 'next/server'
import { getUserUrl } from '@/routes'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId
    const url = new URL(getUserUrl(userId))
    const viewer = req.nextUrl.searchParams.get('viewer_id')
    if (viewer) url.searchParams.set('viewer_id', viewer)
    const res = await fetch(url)
    const body = await res.json()
    if (!res.ok) {
      return NextResponse.json({ detail: body.detail }, { status: res.status })
    }
    return NextResponse.json(body)
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
