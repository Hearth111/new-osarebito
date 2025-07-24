import { NextRequest, NextResponse } from 'next/server'
import { postLikersUrl } from '../../../../../../routs'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const id = Array.isArray(params.postId) ? params.postId[0] : params.postId
    const res = await fetch(postLikersUrl(Number(id)))
    const body = await res.json()
    if (!res.ok) {
      return NextResponse.json({ detail: body.detail }, { status: res.status })
    }
    return NextResponse.json(body)
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
