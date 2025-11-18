import { redirect } from "next/navigation";
import { createSupabaseRSCClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SomedayPage() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  // /month?month=someday にリダイレクト（既存の実装を使用）
  redirect("/month?month=someday");
}

