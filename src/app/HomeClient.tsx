"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getWishlistItems, getSomedayItems } from "@/app/actions/wishlist";
import { WishlistCard } from "@/components/WishlistCard";
import type { WishlistItem } from "@/types/wishlist";
import { SortSelector } from "@/components/SortSelector";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getAroundMonths(): string[] {
  const now = new Date();
  return [-2, -1, 0, 1, 2].map((d) => {
    const dt = new Date(now.getFullYear(), now.getMonth() + d, 1);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  });
}

export function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const month = searchParams.get("month") || currentMonth();
  const sort = searchParams.get("sort") || "created";
  
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [somedayItems, setSomedayItems] = useState<WishlistItem[]>([]);
  const [pending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const [data, someday] = await Promise.all([
          getWishlistItems(month, sort),
          getSomedayItems(),
        ]);
        setItems(data as WishlistItem[]);
        setSomedayItems(someday as WishlistItem[]);
      } catch (error) {
        console.error("Failed to load items:", error);
        setItems([]);
        setSomedayItems([]);
      } finally {
        setIsLoading(false);
      }
    });
  }, [month, sort]);

  // 合計計算: 購入済みと未定アイテムを除外
  const total = items.filter((i) => !i.is_purchased && !i.is_someday).reduce((sum, i) => sum + Number(i.price ?? 0), 0);
  const months = getAroundMonths();

  function handleMonthChange(newMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonth);
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-xs">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            月を選択
          </label>
          <select
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
          >
            {months.map((m) => (
              <option key={m} value={m} className="font-medium">
                {m}
              </option>
            ))}
          </select>
        </div>
        <SortSelector month={month} sort={sort} />
      </header>
      <div className="flex items-center justify-between text-sm text-gray-700">
        <div>月合計(購入済み除外): <span className="font-semibold">{total.toLocaleString()}円</span></div>
        <a href="/new" className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">新規登録</a>
      </div>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading || pending ? (
          <p className="text-sm text-gray-500 col-span-full">読み込み中...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 col-span-full">この月のアイテムはありません。</p>
        ) : (
          items.map((item) => <WishlistCard key={item.id} item={item} />)
        )}
      </section>

      {somedayItems.length > 0 && (
        <section className="mt-8 pt-6 border-t">
          <h2 className="text-lg font-semibold mb-4">いつか欲しいリスト</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {somedayItems.map((item) => (
              <WishlistCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

