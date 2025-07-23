import { NextRequest, NextResponse } from 'next/server'
import { updateProfileUrl } from '../../../../routs'

export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const data = await req.json()
    const res = await fetch(updateProfileUrl(params.userId), {
      method: 'PUT',
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
