import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    // context オブジェクトから動的な :userId を取得します
    const { userId } = context.params;

    // バックエンドAPIのURLを環境変数から取得します
    const backendApiUrl = process.env.BACKEND_API_URL;
    if (!backendApiUrl) {
      throw new Error("BACKEND_API_URL is not defined in environment variables.");
    }

    // リクエストボディを取得します
    const data = await request.json();

    // バックエンドAPIへリクエストを転送します
    const apiResponse = await fetch(`${backendApiUrl}/users/${userId}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // バックエンドからのレスポンスがエラーの場合、その内容をクライアントに返します
    if (!apiResponse.ok) {
        const errorBody = await apiResponse.json();
        return NextResponse.json(errorBody, { status: apiResponse.status });
    }

    const responseBody = await apiResponse.json();
    return NextResponse.json(responseBody, { status: apiResponse.status });

  } catch (error) {
    // 予期せぬエラーが発生した場合の処理
    console.error("Error in PUT /api/users/[userId]/profile:", error);
    return NextResponse.json(
      { detail: "An unexpected server error occurred." },
      { status: 500 }
    );
  }
}
