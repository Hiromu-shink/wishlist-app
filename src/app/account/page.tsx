import { redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/LogoutButton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { updateNotificationPreferences } from "@/app/actions/notifications";
import { NotificationTestButton } from "@/components/NotificationTestButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("notify_deadline, notify_budget")
    .eq("user_id", user.id)
    .single();
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'アカウント' }
      ]} />
      <h1 className="text-2xl font-bold">アカウント</h1>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">メールアドレス</span>
          <span className="font-medium">{user.email}</span>
        </div>
      </div>
      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="text-lg font-semibold">通知設定</h2>
        <form action={updateNotificationPreferences} className="space-y-3">
          <label className="flex items-start gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              name="notify_deadline"
              defaultChecked={prefs?.notify_deadline ?? true}
              className="mt-1"
            />
            <span>期限が近いアイテムを通知（3日前・1日前・当日）</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              name="notify_budget"
              defaultChecked={prefs?.notify_budget ?? true}
              className="mt-1"
            />
            <span>予算の通知（毎週月曜・50%超過・100%超過）</span>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              保存する
            </button>
            <NotificationTestButton />
          </div>
        </form>
      </section>
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

