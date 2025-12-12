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

type Props = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage(props: Props) {
  const user = await getSession();
  if (user) redirect("/");
  
  const searchParams = await (props.searchParams || Promise.resolve({}));
  const error = typeof searchParams.error === "string" ? searchParams.error : null;
  const redirectTo = typeof searchParams.redirect_to === "string" ? searchParams.redirect_to : "/";
  
  return (
    <div className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-xl font-semibold">ログイン</h1>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error === "oauth_cancelled" && "ログインがキャンセルされました。"}
          {error === "oauth_failed" && "ログインに失敗しました。もう一度お試しください。"}
          {error === "no_code" && "認証コードが取得できませんでした。"}
          {error === "no_session" && "セッションの作成に失敗しました。"}
          {error === "unexpected_error" && "予期しないエラーが発生しました。"}
          {!["oauth_cancelled", "oauth_failed", "no_code", "no_session", "unexpected_error"].includes(error) && `エラー: ${error}`}
        </div>
      )}
      <form className="space-y-3" action="/api/auth/login" method="post">
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <input name="email" type="email" required placeholder="メールアドレス" className="w-full h-10 px-3 border rounded" />
        <input name="password" type="password" required placeholder="パスワード" className="w-full h-10 px-3 border rounded" />
        <button className="w-full h-10 px-4 py-2 border rounded bg-black text-white">ログイン</button>
      </form>
      {/* 
      <GoogleAuthButton label="Google でログイン" />
      */}
      <p className="text-sm text-gray-600">
        アカウントがない方は <Link className="underline" href="/signup">新規登録</Link>
      </p>
    </div>
  );
}

