import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const data = await req.json()
    const res = await fetch(`http://localhost:8000/users/${params.userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await res.json()
    return NextResponse.json(body, { status: res.status })
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
