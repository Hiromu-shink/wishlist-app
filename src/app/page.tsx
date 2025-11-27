import { Suspense } from "react";
import { HomeClient } from "./HomeClient";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OAuthRedirectHandler } from "@/components/OAuthRedirectHandler";
import { AllItemsClient } from "./AllItemsClient";

export const dynamic = "force-dynamic";

async function AllItemsPage() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // データ取得: 未購入の全てのアイテム（月別 + Saved）
  // 並び替えはフィルター機能で行うため、サーバー側ではデフォルト（新着順）のみ
  const { data: items } = await supabase
    .from("wishlist")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_purchased", false)
    .or("deleted.is.null,deleted.eq.false")
    .order("created_at", { ascending: false });

  return <AllItemsClient initialItems={items || []} />;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  console.log('=== [HomePage Server] Start ===');
  console.log('[HomePage Server] searchParams:', params);
  console.log('[HomePage Server] searchParams keys:', Object.keys(params || {}));
  console.log('[HomePage Server] month:', params.month);

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

  const month = params.month as string | undefined;

  if (month) {
    console.log('[HomePage Server] Month is specified:', month);
  } else {
    console.log('[HomePage Server] No month specified');
  }

  // 月指定がある場合（someday 以外）
  if (month && month !== 'someday') {
    console.log('[HomePage Server] Showing month page:', month);
    
    // 月別ページを表示（HomeClientを使用）
    return (
      <>
        <OAuthRedirectHandler />
        <Suspense fallback={<div className="mx-auto max-w-3xl p-6"><p className="text-sm text-gray-500">読み込み中...</p></div>}>
          <HomeClient />
        </Suspense>
      </>
    );
  }
  
  // ホーム: 全てのアイテムを表示
  console.log('[HomePage Server] Showing all items');
  
  return (
    <>
      <OAuthRedirectHandler />
      <Suspense fallback={
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-2">Wishlist</h1>
          <p className="text-sm text-gray-500">読み込み中...</p>
        </div>
      }>
        <AllItemsPage />
      </Suspense>
    </>
  );
}
