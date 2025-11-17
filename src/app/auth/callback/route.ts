import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const errorParam = requestUrl.searchParams.get("error");
	const errorDescription = requestUrl.searchParams.get("error_description");

	// OAuthエラーがある場合（例：ユーザーがキャンセル、またはGoogle側のエラー）
	if (errorParam) {
		console.error("OAuth error:", errorParam, errorDescription);
		return NextResponse.redirect(
			requestUrl.origin + `/login?error=${encodeURIComponent(errorParam || "oauth_cancelled")}`
		);
	}

	if (!code) {
		return NextResponse.redirect(requestUrl.origin + "/login?error=no_code");
	}

	try {
		const supabase = await createSupabaseServerClient();
		const { data, error } = await supabase.auth.exchangeCodeForSession(code);
		
		if (error) {
			console.error("Session exchange error:", error);
			return NextResponse.redirect(
				requestUrl.origin + `/login?error=${encodeURIComponent(error.message || "oauth_failed")}`
			);
		}

		if (!data.session) {
			return NextResponse.redirect(requestUrl.origin + "/login?error=no_session");
		}

		// セッションがCookieに保存されるまで少し待つ
		// createSupabaseServerClientのsetメソッドがCookieを設定するが、
		// リダイレクト前に確実に保存されるように待機
		await new Promise(resolve => setTimeout(resolve, 150));

		// デフォルトはホーム、クライアント側でsessionStorageから取得する想定
		const redirectTo = "/";
		
		// リダイレクトレスポンスを作成
		const response = NextResponse.redirect(requestUrl.origin + redirectTo);
		
		// Cookieが確実に送信されるように、Cache-Controlヘッダーを設定
		response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
		
		return response;
	} catch (err) {
		console.error("Unexpected error in OAuth callback:", err);
		return NextResponse.redirect(requestUrl.origin + "/login?error=unexpected_error");
	}
}


