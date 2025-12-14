import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

export const dynamic = "force-dynamic";

async function getSession() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function SignUpPage({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const user = await getSession();
  if (user) redirect("/");
  const params = await (searchParams || Promise.resolve({} as { [key: string]: string | string[] | undefined }));
  const redirectTo = typeof params.redirect_to === "string" ? params.redirect_to : "/";
  return (
    <div className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-xl font-semibold">新規登録</h1>
      <form className="space-y-3" action="/api/auth/signup" method="post">
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input name="email" type="email" required placeholder="メールアドレス" className="w-full h-10 px-3 border rounded" />
        <input name="password" type="password" required placeholder="パスワード" className="w-full h-10 px-3 border rounded" />
        <button className="w-full h-10 px-4 py-2 border rounded bg-black text-white">登録</button>
      </form>
      {/* 
      <GoogleAuthButton label="Google で登録" />
      */}
      <p className="text-sm text-gray-600">
        既にアカウントをお持ちの方は <Link className="underline" href="/login">ログイン</Link>
      </p>
    </div>
  );
}


