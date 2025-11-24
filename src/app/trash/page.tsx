"use client";

import { useEffect, useState, useTransition, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WishlistCard } from "@/components/WishlistCard";
import type { WishlistItem } from "@/types/wishlist";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { restoreWishlistItem, permanentlyDeleteWishlistItem } from "@/app/actions/wishlist";
import { useToast } from "@/components/ui/ToastProvider";
import { FilterMenu } from "@/components/FilterMenu";
import { filterItems, sortItems } from "@/lib/filters";

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ja-JP");
}

function getDeletionDate(deletedAt: string | null | undefined): string | null {
  if (!deletedAt) return null;
  const date = new Date(deletedAt);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + 30); // 30日後
  return date.toISOString().slice(0, 10);
}

function TrashContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const [allItems, setAllItems] = useState<WishlistItem[]>([]);
  const [pending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const sort = (searchParams.get("sort") as any) || "created-desc";
  const deadline = (searchParams.get("deadline") as any) || "all";
  const priceRange = (searchParams.get("priceRange") as any) || "all";
  const priority = (searchParams.get("priority") as any) || "all";

  // フィルターとソートを適用
  const items = useMemo(() => {
    let filtered = filterItems(allItems, { deadline, priceRange, priority });
    return sortItems(filtered, sort);
  }, [allItems, sort, deadline, priceRange, priority]);

  useEffect(() => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        // クライアント側でセッションを確認
        if (typeof window !== 'undefined') {
          const supabase = getSupabaseBrowser();
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.push("/login?redirect_to=" + encodeURIComponent(window.location.pathname));
            return;
          }

          // 削除済みアイテムを取得（deleted_atで降順ソート）
          const { data, error } = await supabase
            .from("wishlist")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("deleted", true)
            .order("deleted_at", { ascending: false, nullsFirst: false });

          if (error) throw error;
          setAllItems((data ?? []) as WishlistItem[]);
        }
      } catch (error) {
        console.error("[TrashPage] Failed to load items:", error);
        setAllItems([]);
      } finally {
        setIsLoading(false);
      }
    });
  }, [router]);

  const handleRestore = async (id: string) => {
    startTransition(async () => {
      try {
        await restoreWishlistItem(id);
        push("復元しました");
        // リストから削除
        setAllItems(allItems.filter(item => item.id !== id));
        router.refresh();
      } catch (error: any) {
        push(error.message || "復元に失敗しました");
      }
    });
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("本当に完全に削除しますか？この操作は取り消せません。")) return;
    startTransition(async () => {
      try {
        await permanentlyDeleteWishlistItem(id);
        push("完全に削除しました");
        // リストから削除
        setAllItems(allItems.filter(item => item.id !== id));
      } catch (error: any) {
        push(error.message || "削除に失敗しました");
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-4">
      {/* パンくずリスト */}
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: '削除済み' }
      ]} />
      
      {/* タイトルとフィルター */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">削除済み</h1>
          <p className="text-gray-600">Total: {items.length}</p>
        </div>
        <FilterMenu preserveParams={[]} />
      </div>

      {/* 注意文 */}
      <p className="text-sm text-amber-600 mb-4">⚠️ 30日後に自動削除されます</p>

      {/* アイテム一覧 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading || pending ? (
          <p className="text-sm text-gray-500 col-span-full">読み込み中...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 col-span-full">削除済みのアイテムはありません。</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="border border-[#dddddd] rounded-lg bg-white overflow-hidden shadow-sm flex flex-col">
              <div className="flex h-full flex-col p-4 text-left">
                {/* 画像 */}
                <div className="relative w-full h-[200px] overflow-hidden rounded-md bg-white mb-3">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-[#999]">
                      No Image
                    </div>
                  )}
                </div>
                
                {/* 商品情報 */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-base font-bold leading-snug text-[#333] line-clamp-2 min-h-[3.25rem] mb-2">
                    {item.name}
                  </h3>
                  <div className="space-y-1 mb-3">
                    <span className="text-lg font-bold text-black block">
                      {item.price ? `¥${item.price.toLocaleString()}` : "¥-"}
                    </span>
                    {item.deleted_at && (
                      <div className="text-xs text-[#666] space-y-1">
                        <p>削除日: {formatDate(item.deleted_at) ?? "-"}</p>
                        <p className="text-amber-600">
                          削除予定: {formatDate(getDeletionDate(item.deleted_at)) ?? "-"}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* アクションボタン */}
                  <div className="mt-auto flex gap-2">
                    <button
                      onClick={() => handleRestore(item.id)}
                      disabled={pending}
                      className="flex-1 px-3 py-2 border rounded text-xs disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black hover:bg-gray-50"
                    >
                      {pending ? "処理中..." : "復元"}
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(item.id)}
                      disabled={pending}
                      className="flex-1 px-3 py-2 border border-red-500 text-red-600 rounded text-xs disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-red-50"
                    >
                      {pending ? "処理中..." : "完全削除"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default function TrashPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: '削除済み' }
        ]} />
        <h1 className="text-2xl font-bold mb-2">削除済み</h1>
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    }>
      <TrashContent />
    </Suspense>
  );
}
