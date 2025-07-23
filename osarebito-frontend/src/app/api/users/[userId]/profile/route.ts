import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  // 修正点: 第2引数を context オブジェクトとして受け取り、その中の params を使用します。
  // Next.jsのRoute Handlersでは、動的セグメント（[userId]など）はcontext.paramsで提供されます。
  context: { params: { userId: string } } 
) {
  try {
    // context.params から userId を取得します。
    const userId = context.params.userId; 
    const data = await req.json()
    const res = await fetch(`http://localhost:8000/users/${userId}/profile`, { // 修正点: params.userId を userId に変更
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await res.json()
    return NextResponse.json(body, { status: res.status })
  } catch (error) { // 修正点: エラーオブジェクトをキャッチし、ログに出力することも検討
    console.error("Error in PUT /api/users/[userId]/profile:", error); // エラーログを追加
    return NextResponse.json({ detail: 'Server error' }, { status: 500 })
  }
}
