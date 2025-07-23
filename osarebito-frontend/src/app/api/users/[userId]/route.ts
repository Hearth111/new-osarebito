import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  // 修正点：こちらも同様に、第一引数に request を追加します
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    const { userId } = context.params;
    const backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';

    const res = await fetch(`${backendApiUrl}/users/${userId}`);
    const body = await res.json();
    return NextResponse.json(body, { status: res.status });

  } catch (error) {
    console.error("Error in GET /api/users/[userId]:", error);
    return NextResponse.json({ detail: 'Server error' }, { status: 500 });
  }
}
