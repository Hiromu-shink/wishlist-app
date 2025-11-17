import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get('code');
	const errorParam = requestUrl.searchParams.get('error');
	const errorDescription = requestUrl.searchParams.get('error_description');

	console.log('[Callback] Start');
	console.log('[Callback] Code:', code ? code.substring(0, 10) + '...' : 'null');
	console.log('[Callback] Error param:', errorParam);
	console.log('[Callback] Error description:', errorDescription);

	// OAuthエラーがある場合（例：ユーザーがキャンセル、またはGoogle側のエラー）
	if (errorParam) {
		console.error('[Callback] OAuth error:', errorParam, errorDescription);
		return NextResponse.redirect(
			requestUrl.origin + `/login?error=${encodeURIComponent(errorParam || "oauth_cancelled")}`
		);
	}

	if (!code) {
		console.error('[Callback] No code provided');
		return NextResponse.redirect(requestUrl.origin + "/login?error=no_code");
	}

	try {
		const cookieStore = await cookies();
		
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					get(name: string) {
						const value = cookieStore.get(name)?.value;
						console.log(`[Callback] Cookie get: ${name} = ${value ? value.substring(0, 20) + '...' : 'null'}`);
						return value;
					},
					set(name: string, value: string, options: CookieOptions) {
						try {
							console.log(`[Callback] Cookie set: ${name} = ${value.substring(0, 20)}...`);
							cookieStore.set({ name, value, ...options });
						} catch (error) {
							console.error('[Callback] Cookie set error:', error);
						}
					},
					remove(name: string, options: CookieOptions) {
						try {
							console.log(`[Callback] Cookie remove: ${name}`);
							cookieStore.set({ name, value: '', ...options });
						} catch (error) {
							console.error('[Callback] Cookie remove error:', error);
						}
					},
				},
			}
		);

		// 既存のセッションを確認
		const { data: { session: oldSession } } = await supabase.auth.getSession();
		if (oldSession) {
			console.log('[Callback] Old session found:', oldSession.user.email);
			console.log('[Callback] Old session user ID:', oldSession.user.id);
			// 古いセッションをクリア
			await supabase.auth.signOut();
			console.log('[Callback] Old session cleared');
		} else {
			console.log('[Callback] No old session found');
		}

		// セッションを交換
		console.log('[Callback] Exchanging code for session...');
		const { data, error } = await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error('[Callback] Error:', error.message);
			console.error('[Callback] Error details:', error);
			return NextResponse.redirect(
				requestUrl.origin + `/login?error=${encodeURIComponent(error.message || "oauth_failed")}`
			);
		}

		if (!data.session) {
			console.error('[Callback] No session in response');
			return NextResponse.redirect(requestUrl.origin + "/login?error=no_session");
		}

		console.log('[Callback] Session created for:', data.session.user.email);
		console.log('[Callback] User ID:', data.session.user.id);
		console.log('[Callback] Access token (first 20 chars):', data.session.access_token.substring(0, 20) + '...');

		// 成功したらホームにリダイレクト
		const redirectTo = "/";
		console.log('[Callback] Redirecting to:', redirectTo);
		
		const response = NextResponse.redirect(requestUrl.origin + redirectTo);
		response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
		
		return response;
	} catch (err) {
		console.error('[Callback] Unexpected error:', err);
		if (err instanceof Error) {
			console.error('[Callback] Error message:', err.message);
			console.error('[Callback] Error stack:', err.stack);
		}
		return NextResponse.redirect(requestUrl.origin + "/login?error=unexpected_error");
	}
}


