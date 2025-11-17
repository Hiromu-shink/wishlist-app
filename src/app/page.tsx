import { Suspense } from "react";
import { HomeLanding } from "./HomeLanding";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OAuthRedirectHandler } from "@/components/OAuthRedirectHandler";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  console.log('[Home] Checking user session...');
  if (userError) {
    console.error('[Home] Error getting user:', userError.message);
  }
  
  if (!user) {
    console.log('[Home] No user found, redirecting to login');
    redirect("/login");
  }
  
  console.log('[Home] Current session user:', user.email);
  console.log('[Home] User ID:', user.id);
  
  // セッションも確認
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    console.log('[Home] Session found for:', session.user.email);
    console.log('[Home] Session user ID:', session.user.id);
  } else {
    console.log('[Home] No session found');
  }
  
  return (
    <>
      <OAuthRedirectHandler />
      <Suspense fallback={<div className="mx-auto max-w-3xl p-6"><p className="text-sm text-gray-500">読み込み中...</p></div>}>
        <HomeLanding />
      </Suspense>
    </>
  );
}
