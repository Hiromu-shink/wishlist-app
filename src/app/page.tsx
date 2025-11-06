"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getWishlistItems } from "@/app/actions/wishlist";
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

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const month = searchParams.get("month") || currentMonth();
  const sort = searchParams.get("sort") || "created";
  
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [pending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const data = await getWishlistItems(month, sort);
        setItems(data as WishlistItem[]);
      } catch (error) {
        console.error("Failed to load items:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    });
  }, [month, sort]);

  const total = items.filter((i) => !i.is_purchased).reduce((sum, i) => sum + Number(i.price ?? 0), 0);
  const months = getAroundMonths();

  function handleMonthChange(newMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonth);
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {months.map((m) => (
            <button
              key={m}
              onClick={() => handleMonthChange(m)}
              className={`px-3 py-1 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
                m === month ? "bg-black text-white" : "bg-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <SortSelector month={month} sort={sort} />
      </header>
      <div className="flex items-center justify-between text-sm text-gray-700">
        <div>月合計(購入済み除外): <span className="font-semibold">{total.toLocaleString()}円</span></div>
        <a href="/new" className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">新規登録</a>
      </div>
      <section className="grid grid-cols-1 gap-3">
        {isLoading || pending ? (
          <p className="text-sm text-gray-500">読み込み中...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">この月のアイテムはありません。</p>
        ) : (
          items.map((item) => <WishlistCard key={item.id} item={item} />)
        )}
      </section>
    </div>
  );
}
