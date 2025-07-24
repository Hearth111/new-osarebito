import { NextRequest, NextResponse } from 'next/server'
import { groupMessagesUrl } from '@/routes'

export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const res = await fetch(groupMessagesUrl(parseInt(params.groupId)))
    const body = await res.json()
    if (!res.ok) {
      return NextResponse.json({ detail: body.detail }, { status: res.status })
    }
    return NextResponse.json(body)
  } catch {
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const data = await req.json()
    const res = await fetch(groupMessagesUrl(parseInt(params.groupId)), {
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
