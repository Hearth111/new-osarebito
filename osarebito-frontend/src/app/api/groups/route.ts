import { NextRequest, NextResponse } from 'next/server'
import { createGroupUrl } from '@/routes'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const res = await fetch(createGroupUrl, {
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
