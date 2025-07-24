import { NextRequest, NextResponse } from 'next/server'
import { updateCollabProfileUrl } from '@/routes'
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function PUT(req: NextRequest, { params }: { params: any }) {
  try {
    const data = await req.json()
    const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId
    const res = await fetch(updateCollabProfileUrl(userId), {
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
