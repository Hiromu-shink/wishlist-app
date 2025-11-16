import { NextResponse } from "next/document";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession();
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/";
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url));
  }
  return NextResponse.redirect(new URL(next, url));
}


