import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const new_password = String(form.get("new_password") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: new_password });
  if (error) {
    return NextResponse.redirect(new URL(`/account?error=${encodeURIComponent(error.message)}`, request.url));
  }
  return NextResponse.redirect(new URL(`/account?ok=1`, request.url));
}


