import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  // 修正点: 第1引数に `request` を追加
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    const { userId } = context.params;
    const data = await request.json();

    // 外部APIのURLは直接書かず、環境変数から読み込むのが安全です
    const backendApiUrl = process.env.BACKEND_API_URL || 'http://localhost:8000';

    const res = await fetch(`${backendApiUrl}/users/${userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // バックエンドからのレスポンスをそのまま返す
    const body = await res.json();
    return NextResponse.json(body, { status: res.status });

  } catch (error) {
    console.error("Error in PUT /api/users/[userId]/profile:", error);
    return NextResponse.json({ detail: 'Server error' }, { status: 500 });
  }
}
