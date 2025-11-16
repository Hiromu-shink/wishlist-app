import { redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-xl font-semibold">アカウント情報</h1>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">メールアドレス</span>
          <span className="font-medium">{user.email}</span>
        </div>
      </div>
      <form className="space-y-3" action="/api/auth/change-password" method="post">
        <input name="new_password" type="password" placeholder="新しいパスワード" required className="w-full h-10 px-3 border rounded" />
        <button className="h-10 px-4 py-2 border rounded bg-black text-white">パスワードを変更</button>
      </form>
      <div>
        <LogoutButton />
      </div>
    </div>
  );
}

