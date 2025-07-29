import { NextRequest, NextResponse } from 'next/server'
import { getPostUrl } from '@/routes'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId
    const res = await fetch(getPostUrl(Number(postId)))
    const body = await res.json()
    if (!res.ok) {
      return NextResponse.json({ detail: body.detail }, { status: res.status })
    }
    return NextResponse.json(body)
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
