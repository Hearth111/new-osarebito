import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const res = await fetch(`http://localhost:8000/users/${params.userId}`)
    const body = await res.json()
    return NextResponse.json(body, { status: res.status })
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
