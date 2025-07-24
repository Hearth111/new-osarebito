import { NextRequest, NextResponse } from 'next/server'
import { unretweetPostUrl } from '../../../../../routs'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: NextRequest, { params }: { params: any }) {
  try {
    const data = await req.json()
    const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId
    const res = await fetch(unretweetPostUrl(Number(postId)), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await res.json()
    if (!res.ok) {
      return NextResponse.json({ detail: body.detail }, { status: res.status })
    }
    return NextResponse.json(body)
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
