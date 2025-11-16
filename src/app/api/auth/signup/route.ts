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
  // 要望: メール承認の有無にかかわらず、登録後はログイン画面へ遷移させる
  // 万一セッションが作成されている場合は一旦サインアウトしてログイン画面へ誘導
  if (data.session) {
    await supabase.auth.signOut();
  }
  const url = new URL(`/login?message=${encodeURIComponent("アカウントを作成しました。ログインしてください。")}`, request.url);
  if (redirectTo) url.searchParams.set("redirect_to", redirectTo);
  return NextResponse.redirect(url);
}


