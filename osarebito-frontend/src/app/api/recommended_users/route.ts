import { NextResponse } from 'next/server'
import { BACKEND_URL } from '../../../routs'

export async function GET() {
  const res = await fetch(`${BACKEND_URL}/recommended_users`)
  const body = await res.json()
  return NextResponse.json(body, { status: res.status })
}
