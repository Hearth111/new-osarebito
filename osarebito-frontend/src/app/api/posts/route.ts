import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '../../../routs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const feed = searchParams.get('feed') || 'all'
  const userId = searchParams.get('user_id')
  const params = new URLSearchParams({ feed })
  if (userId) params.append('user_id', userId)
  const res = await fetch(`${BACKEND_URL}/posts?${params.toString()}`)
  const body = await res.json()
  return NextResponse.json(body, { status: res.status })
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const res = await fetch(`${BACKEND_URL}/posts`, {
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
