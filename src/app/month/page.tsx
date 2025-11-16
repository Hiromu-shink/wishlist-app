import { Suspense } from "react";
import { HomeClient } from "../HomeClient";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MonthPage() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl p-6"><p className="text-sm text-gray-500">読み込み中...</p></div>}>
      <HomeClient />
    </Suspense>
  );
}
