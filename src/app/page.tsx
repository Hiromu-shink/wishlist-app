import { Suspense } from "react";
import { HomeClient } from "./HomeClient";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OAuthRedirectHandler } from "@/components/OAuthRedirectHandler";
import { HomeMonthPicker } from "@/components/HomeMonthPicker";
import { AllItemsClient } from "./AllItemsClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "¥-";
  return `¥${price.toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ja-JP");
}

async function AllItemsPage({ sort }: { sort: string }) {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // データ取得: 未購入の全てのアイテム（月別 + Saved）
  let query = supabase
    .from("wishlist")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_purchased", false)
    .or("deleted.is.null,deleted.eq.false");

  // 並び替え
  switch (sort) {
    case "created-desc":
    case "created":
      query = query.order("created_at", { ascending: false });
      break;
    case "priority-desc":
      query = query.order("priority", { ascending: false });
      break;
    case "priority-asc":
      query = query.order("priority", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false, nullsFirst: true as any });
      break;
    case "price-asc":
      query = query.order("price", { ascending: true, nullsFirst: true as any });
      break;
    case "deadline-asc":
      query = query.order("deadline", { ascending: true, nullsFirst: true as any });
      break;
    case "deadline-desc":
      query = query.order("deadline", { ascending: false, nullsFirst: true as any });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: items } = await query;

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
  const sort = (params.sort as string | undefined) || "created-desc";

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
      <AllItemsPage sort={sort} />
    </>
  );
}
