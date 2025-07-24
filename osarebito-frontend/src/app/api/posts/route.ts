import { NextRequest, NextResponse } from 'next/server'
import { postsUrl, createPostUrl } from '@/routes'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const feed = searchParams.get('feed') || 'all'
    const user_id = searchParams.get('user_id') || undefined
    const url = postsUrl(feed, user_id || undefined)
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

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const res = await fetch(createPostUrl, {
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
