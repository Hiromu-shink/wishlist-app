import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const requestUrl = new URL(request.url);
	const code = requestUrl.searchParams.get("code");
	const redirectTo = requestUrl.searchParams.get("redirect_to") || "/";

	if (code) {
		const supabase = await createSupabaseServerClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			return NextResponse.redirect(requestUrl.origin + redirectTo);
		}
	}

	return NextResponse.redirect(requestUrl.origin + "/login?error=oauth_failed");
}


