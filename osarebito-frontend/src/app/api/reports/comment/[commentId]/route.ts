import { NextRequest, NextResponse } from 'next/server'
import { reportCommentUrl } from '@/routes'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: NextRequest, { params }: { params: any }) {
  try {
    const data = await req.json()
    const commentId = Array.isArray(params.commentId) ? params.commentId[0] : params.commentId
    const res = await fetch(reportCommentUrl(Number(commentId)), {
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
