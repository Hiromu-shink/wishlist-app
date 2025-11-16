export const dynamic = "force-dynamic";

import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SearchPage() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">検索</h1>
      <p className="text-sm text-gray-600">検索機能は今後追加予定です。</p>
    </div>
  );
}
