import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const provider = String(form.get("provider") ?? "google");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as any,
    options: { redirectTo: new URL("/", request.url).toString() },
  });
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
  }
  return NextResponse.redirect(data.url ?? new URL("/login", request.url));
}


