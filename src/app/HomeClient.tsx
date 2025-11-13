"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getWishlistItems } from "@/app/actions/wishlist";
import { WishlistCard } from "@/components/WishlistCard";
import type { WishlistItem } from "@/types/wishlist";
import { SortSelector } from "@/components/SortSelector";

const buttonBase = "h-10 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const month = searchParams.get("month") || currentMonth();
  const sort = searchParams.get("sort") || "created-desc";
  const isSomeday = month === "someday";
  
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [pending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const defaultMonth = useMemo(() => currentMonth(), []);

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
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-[150px] text-left">
              {!isSomeday ? (
                isTouchDevice ? (
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
                  <input
                    type="month"
                    className={`${buttonBase} w-full`}
                    value={month}
                    min="2025-01"
                    max="2074-12"
                    list="month-options-desktop"
                    onChange={(e) => handleMonthChange(e.target.value)}
                  />
                )
              ) : (
                <div className={`${buttonBase} w-full bg-gray-50 text-center text-gray-600`}>いつか欲しいもの</div>
              )}
            </div>
            {!isSomeday ? (
              <Link href="/month?month=someday" className={`${buttonBase} whitespace-nowrap`}>
                いつかリスト
              </Link>
            ) : (
              <Link href={`/month?month=${defaultMonth}`} className={`${buttonBase} whitespace-nowrap`}>
                月リストへ
              </Link>
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
        {!isSomeday && (
          <datalist id="month-options-desktop">
            {monthOptions.map((option) => (
              <option value={option} key={option} />
            ))}
          </datalist>
        )}
      </header>
      {!isSomeday && (
        <div className="flex items-center justify-between text-sm text-gray-700">
          <div>月合計(購入済み除外): <span className="font-semibold">{total.toLocaleString()}円</span></div>
        </div>
      )}

      {isSomeday && (
        <h2 className="text-lg font-semibold text-gray-900">いつか欲しいものリスト</h2>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading || pending ? (
          <p className="text-sm text-gray-500 col-span-full">読み込み中...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 col-span-full">{isSomeday ? "いつか欲しいリストのアイテムはありません。" : "この月のアイテムはありません。"}</p>
        ) : (
          items.map((item) => <WishlistCard key={item.id} item={item} />)
        )}
      </section>
    </div>
  );
}

