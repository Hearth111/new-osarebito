import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/routes'

export async function GET() {
  const res = await fetch(`${BACKEND_URL}/popular_tags`)
  const body = await res.json()
  return NextResponse.json(body, { status: res.status })
}
