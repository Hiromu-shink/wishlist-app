import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseRSCClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

async function getSession() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function LoginPage() {
  const user = await getSession();
  if (user) redirect("/");
  return (
    <div className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-xl font-semibold">ログイン</h1>
      <form className="space-y-3" action="/api/auth/login" method="post">
        <input name="email" type="email" required placeholder="メールアドレス" className="w-full h-10 px-3 border rounded" />
        <input name="password" type="password" required placeholder="パスワード" className="w-full h-10 px-3 border rounded" />
        <button className="w-full h-10 px-4 py-2 border rounded bg-black text-white">ログイン</button>
      </form>
      <form action="/api/auth/oauth" method="post">
        <input type="hidden" name="provider" value="google" />
        <button className="w-full h-10 px-4 py-2 border rounded">Google でログイン</button>
      </form>
      <p className="text-sm text-gray-600">
        アカウントがない方は <Link className="underline" href="/signup">新規登録</Link>
      </p>
    </div>
  );
}

