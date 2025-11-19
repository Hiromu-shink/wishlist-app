export const dynamic = "force-dynamic";

import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function StatsPage() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">統計・ダッシュボード</h1>
      <p className="text-gray-600 mb-8">全体の統計情報を表示します</p>
      <div className="text-center text-gray-400">準備中...</div>
    </div>
  );
}
