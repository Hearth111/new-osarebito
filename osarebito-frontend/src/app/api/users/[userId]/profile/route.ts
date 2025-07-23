import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  // 修正点：Next.jsのルールに従い、第一引数に request を追加します
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    const { userId } = context.params;
    const data = await request.json();

    const backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';

    const res = await fetch(`${backendApiUrl}/users/${userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const body = await res.json();
    return NextResponse.json(body, { status: res.status });

  } catch (error) {
    console.error("Error in PUT /api/users/[userId]/profile:", error);
    return NextResponse.json({ detail: 'Server error' }, { status: 500 });
  }
}
