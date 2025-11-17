import { Suspense } from "react";
import { HomeLanding } from "./HomeLanding";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OAuthRedirectHandler } from "@/components/OAuthRedirectHandler";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return (
    <>
      <OAuthRedirectHandler />
      <Suspense fallback={<div className="mx-auto max-w-3xl p-6"><p className="text-sm text-gray-500">読み込み中...</p></div>}>
        <HomeLanding />
      </Suspense>
    </>
  );
}
