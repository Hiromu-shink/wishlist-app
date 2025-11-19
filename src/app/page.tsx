import { Suspense } from "react";
import { HomeClient } from "./HomeClient";
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OAuthRedirectHandler } from "@/components/OAuthRedirectHandler";
import { HomeMonthPicker } from "@/components/HomeMonthPicker";
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

async function AllItemsPage() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // データ取得: 未購入かつ「いつか欲しいリスト」以外
  const { data: items } = await supabase
    .from("wishlist")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_purchased", false)
    .eq("is_someday", false)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">欲しいものリスト</h1>
      <p className="text-gray-600 mb-4">全ての欲しいもの（{items?.length || 0}個）</p>

      <HomeMonthPicker />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {items?.map((item) => (
          <Link
            key={item.id}
            href={`/item/${item.id}`}
            className="border border-[#dddddd] rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white flex flex-col"
          >
            {/* 画像 */}
            <div className="relative h-32 overflow-hidden bg-[#f0f0f0]">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-gray-400">No Image</span>
                </div>
              )}
            </div>

            {/* 商品名 */}
            <div className="p-2 flex-1 flex flex-col">
              <h3 className="text-sm font-bold line-clamp-2 mb-1 text-[#333] min-h-[2.5rem]">
                {item.name}
              </h3>

              {/* 価格 */}
              {item.price && (
                <p className="text-xs text-black font-semibold mb-1">
                  {formatPrice(item.price)}
                </p>
              )}

              {/* 優先度 */}
              <div className="flex gap-0.5 text-xs text-[#FFD700] mb-1" aria-label={`優先度 ${item.priority}`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>{i < item.priority ? "★" : "☆"}</span>
                ))}
              </div>

              {/* 期限 */}
              {item.deadline ? (
                <p className="text-xs text-[#666]">
                  {formatDate(item.deadline) ?? "-"}
                </p>
              ) : (
                <p className="text-xs text-[#666]">期限: 未定</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {items?.length === 0 && (
        <div className="text-center text-gray-400 mt-8">
          欲しいものがまだありません
        </div>
      )}
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
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

  const month = searchParams?.month;

  return (
    <>
      <OAuthRedirectHandler />
      {month ? (
        <Suspense fallback={<div className="mx-auto max-w-3xl p-6"><p className="text-sm text-gray-500">読み込み中...</p></div>}>
          <HomeClient />
        </Suspense>
      ) : (
        <AllItemsPage />
      )}
    </>
  );
}
