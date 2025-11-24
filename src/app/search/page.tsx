"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { WishlistItem } from "@/types/wishlist";
import Link from "next/link";

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

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [pending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  // デバウンス処理（500ms待機）
  useEffect(() => {
    if (!searchQuery.trim()) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const supabase = getSupabaseBrowser();
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.push("/login?redirect_to=" + encodeURIComponent(window.location.pathname));
            return;
          }

          // 商品名とメモで検索（ILIKEで大文字小文字を区別しない）
          // 検索ワードをエスケープ
          const escapedQuery = searchQuery.replace(/%/g, "\\%").replace(/_/g, "\\_");
          const { data, error } = await supabase
            .from("wishlist")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("is_purchased", false)
            .or("deleted.is.null,deleted.eq.false")
            .or(`name.ilike.%${escapedQuery}%,comment.ilike.%${escapedQuery}%`)
            .order("created_at", { ascending: false });

          if (error) throw error;
          setItems((data ?? []) as WishlistItem[]);
        } catch (error) {
          console.error("[SearchPage] Failed to search items:", error);
          setItems([]);
        } finally {
          setIsLoading(false);
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, router]);

  // URLパラメータを更新
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery);
    }
    const newUrl = searchQuery.trim() 
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [searchQuery]);

  return (
    <div className="container mx-auto px-4 py-4">
      {/* パンくずリスト */}
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: '検索' }
      ]} />

      {/* タイトル */}
      <h1 className="text-2xl font-bold mb-2">検索結果</h1>

      {/* 検索バー */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="商品名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black"
          autoFocus
        />
      </div>

      {/* サブタイトル */}
      {searchQuery.trim() && (
        <p className="text-gray-600 mb-4">
          "{searchQuery}" の検索結果: {items.length}件
        </p>
      )}

      {/* 検索結果 */}
      {!searchQuery.trim() ? (
        <p className="text-sm text-gray-500">検索ワードを入力してください。</p>
      ) : isLoading || pending ? (
        <p className="text-sm text-gray-500">検索中...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">検索結果が見つかりませんでした。</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/item/${item.id}`}
              className="border border-[#dddddd] rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white flex flex-col"
            >
              {/* 画像 */}
              <div className="relative h-32 overflow-hidden bg-white">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-32 object-cover"
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
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: '検索' }
        ]} />
        <h1 className="text-2xl font-bold mb-2">検索結果</h1>
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
