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

		// デフォルトはホーム、クライアント側でsessionStorageから取得する想定
		const redirectTo = "/";
		return NextResponse.redirect(requestUrl.origin + redirectTo);
	} catch (err) {
		console.error("Unexpected error in OAuth callback:", err);
		return NextResponse.redirect(requestUrl.origin + "/login?error=unexpected_error");
	}
}


