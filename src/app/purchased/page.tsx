"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WishlistCard } from "@/components/WishlistCard";
import type { WishlistItem } from "@/types/wishlist";
import { Breadcrumb } from "@/components/Breadcrumb";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { FilterMenu } from "@/components/FilterMenu";
import { filterItems, sortItems } from "@/lib/filters";

export default function PurchasedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

          // 購入済みアイテムを取得（purchased_dateで降順ソート）
          const { data, error } = await supabase
            .from("wishlist")
            .select("*")
            .eq("user_id", session.user.id)
            .eq("is_purchased", true)
            .or("deleted.is.null,deleted.eq.false")
            .order("purchased_date", { ascending: false, nullsFirst: false });

          if (error) throw error;
          setAllItems((data ?? []) as WishlistItem[]);
        }
      } catch (error) {
        console.error("[PurchasedPage] Failed to load items:", error);
        setAllItems([]);
      } finally {
        setIsLoading(false);
      }
    });
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-4">
      {/* パンくずリスト */}
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: '購入済み' }
      ]} />
      
      {/* タイトルとフィルター */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">購入済み</h1>
          <p className="text-gray-600">Total: {items.length}</p>
        </div>
        <FilterMenu preserveParams={[]} />
      </div>

      {/* アイテム一覧 */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading || pending ? (
          <p className="text-sm text-gray-500 col-span-full">読み込み中...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 col-span-full">購入済みのアイテムはありません。</p>
        ) : (
          items.map((item) => <WishlistCard key={item.id} item={item} from="purchased" />)
        )}
      </section>
    </div>
  );
}
