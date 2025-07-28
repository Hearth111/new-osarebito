import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { userBookmarksUrl } from '@/routes'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest, context: { params: any }) {
  try {
    const { params } = await context
    const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId
    const res = await fetch(userBookmarksUrl(userId))
    const body = await res.json()
    if (!res.ok) {
      return NextResponse.json({ detail: body.detail }, { status: res.status })
    }
    return NextResponse.json(body)
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
