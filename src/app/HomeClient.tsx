"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getWishlistItems, getSomedayItems } from "@/app/actions/wishlist";
import { WishlistCard } from "@/components/WishlistCard";
import type { WishlistItem } from "@/types/wishlist";
import { SortSelector } from "@/components/SortSelector";

const buttonBase = "h-10 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black";
const buttonWhite = `${buttonBase} bg-white hover:bg-gray-50`;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const month = searchParams.get("month") || currentMonth();
  const sort = searchParams.get("sort") || "created-desc";
  
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [somedayItems, setSomedayItems] = useState<WishlistItem[]>([]);
  const [pending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const monthOptions = useMemo(() => {
    const startYear = 2025;
    const years = 50;
    const list: string[] = [];
    for (let year = startYear; year < startYear + years; year += 1) {
      for (let m = 1; m <= 12; m += 1) {
        list.push(`${year}-${String(m).padStart(2, "0")}`);
      }
    }
    return list;
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(pointer: coarse)");
      const update = (e: MediaQueryListEvent | MediaQueryList) => {
        setIsTouchDevice(e.matches);
      };
      update(mq);
      const handler = (e: MediaQueryListEvent) => update(e);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
    return () => {};
  }, []);

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

  function handleMonthChange(newMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonth);
    router.push(`/month?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex-shrink-0 w-[150px] text-left">
            {isTouchDevice ? (
              <>
                <input
                  type="month"
                  className={`${buttonBase} w-full`}
                  value={month}
                  min="2025-01"
                  max="2074-12"
                  list="month-options"
                  onChange={(e) => handleMonthChange(e.target.value)}
                />
                <datalist id="month-options">
                  {monthOptions.map((option) => (
                    <option value={option} key={option} />
                  ))}
                </datalist>
              </>
            ) : (
              <select
                className={`${buttonBase} w-full`}
                value={month}
                onChange={(e) => handleMonthChange(e.target.value)}
              >
                {monthOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex-shrink-0 w-[150px] text-right">
            <SortSelector
              month={month}
              sort={sort}
              className={`${buttonBase} w-full`}
            />
          </div>
        </div>
      </header>
      <div className="flex items-center justify-between text-sm text-gray-700">
        <div>月合計(購入済み除外): <span className="font-semibold">{total.toLocaleString()}円</span></div>
        <a href="/new" className={buttonWhite}>新規登録</a>
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

