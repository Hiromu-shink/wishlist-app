import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const redirectTo = String(form.get("redirect_to") ?? "/");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return NextResponse.redirect(new URL(`/signup?error=${encodeURIComponent(error.message)}`, request.url));
  }
  // Eメール確認が有効な場合、直ちにセッションは作成されない
  if (!data.session) {
    return NextResponse.redirect(new URL(`/login?message=${encodeURIComponent("確認メールを送信しました。メールを確認してください。")}`, request.url));
  }
  return NextResponse.redirect(new URL(redirectTo, request.url));
}


