import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { postsByTagUrl } from '@/routes'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const tag = Array.isArray(params.tag) ? params.tag[0] : params.tag
    const res = await fetch(postsByTagUrl(tag))
    const body = await res.json()
    if (!res.ok) {
      return NextResponse.json({ detail: body.detail }, { status: res.status })
    }
    return NextResponse.json(body)
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
