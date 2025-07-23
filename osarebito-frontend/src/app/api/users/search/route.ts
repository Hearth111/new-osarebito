import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query') || ''
    const res = await fetch(`http://localhost:8000/users/search?query=${encodeURIComponent(query)}`)
    const body = await res.json()
    return NextResponse.json(body, { status: res.status })
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
