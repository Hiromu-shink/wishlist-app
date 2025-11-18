"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { WishlistCard } from "@/components/WishlistCard";
import type { WishlistItem } from "@/types/wishlist";
import { SortSelector } from "@/components/SortSelector";

const buttonBase = "h-10 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black";
const startYear = 2025;
const totalYears = 50;
const endYear = startYear + totalYears - 1;

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
  const fallbackMonth = useMemo(() => currentMonth(), []);
  const fallbackYear = useMemo(() => Number(fallbackMonth.split("-")[0]), [fallbackMonth]);
  const [pickerYear, setPickerYear] = useState(() => {
    const source = isSomeday ? fallbackMonth : month;
    const y = Number(source.split("-")[0]);
    return Number.isFinite(y) ? y : fallbackYear;
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [pickerMonth, setPickerMonth] = useState(() => {
    const source = isSomeday ? fallbackMonth : month;
    const m = Number(source.split("-")[1]);
    return Number.isFinite(m) ? m : 1;
  });

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
    const source = isSomeday ? fallbackMonth : month;
    const [yStr, mStr] = source.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    if (Number.isFinite(y)) {
      setPickerYear(() => {
        if (y < startYear) return startYear;
        if (y > endYear) return endYear;
        return y;
      });
    }
    if (Number.isFinite(m)) {
      setPickerMonth(() => {
        if (m < 1) return 1;
        if (m > 12) return 12;
        return m;
      });
    }
  }, [month, isSomeday, fallbackMonth]);

  useEffect(() => {
    if (!pickerOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);


  useEffect(() => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        // クライアント側でセッションを確認
        if (typeof window !== 'undefined') {
          const { getSupabaseBrowser } = await import('@/lib/supabase/client');
          const supabase = getSupabaseBrowser();
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('[HomeClient] Current session:', session.user.email);
            console.log('[HomeClient] User ID:', session.user.id);
          } else {
            console.log('[HomeClient] No session found');
          }
        }
        
        console.log('[HomeClient] Fetching wishlist items for month:', month);
        const res = await fetch(`/api/wishlist?month=${encodeURIComponent(month)}&sort=${encodeURIComponent(sort)}`, { cache: "no-store" });
        if (res.status === 401) {
          console.log('[HomeClient] 401 Unauthorized, redirecting to login');
          router.push("/login?redirect_to=" + encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"));
          return;
        }
        if (!res.ok) throw new Error(`failed: ${res.status}`);
        const data = await res.json();
        console.log('[HomeClient] Received items count:', data?.items?.length ?? 0);
        setItems((data?.items ?? []) as WishlistItem[]);
      } catch (error) {
        console.error("[HomeClient] Failed to load items:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    });
  }, [month, sort, router]);

  // 合計計算: 購入済みと未定アイテムを除外
  const total = items.filter((i) => !i.is_purchased && !i.is_someday).reduce((sum, i) => sum + Number(i.price ?? 0), 0);

  function handleMonthChange(newMonth: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", newMonth);
    router.push(`/month?${params.toString()}`);
  }

  const desktopPicker = (
    <div className="relative w-full" ref={pickerRef}>
      <button
        type="button"
        className={`${buttonBase} w-full flex items-center justify-center gap-3 font-semibold`}
        onClick={() => setPickerOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={pickerOpen}
      >
        <span className="text-base tracking-wide">{pickerYear}</span>
        <span className="text-base text-gray-700">▼</span>
      </button>
      {pickerOpen && (
        <div className="absolute left-0 z-40 mt-2 w-[220px] rounded-[20px] border border-gray-200 bg-white p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="rounded px-3 py-2 text-base font-semibold hover:bg-gray-100 disabled:text-gray-400"
              onClick={() => setPickerYear((prev) => Math.max(startYear, prev - 1))}
              disabled={pickerYear <= startYear}
              aria-label="前年へ"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              ◀
            </button>
            <div className="text-base font-semibold text-gray-900">{pickerYear}</div>
            <button
              type="button"
              className="rounded px-3 py-2 text-base font-semibold hover:bg-gray-100 disabled:text-gray-400"
              onClick={() => setPickerYear((prev) => Math.min(endYear, prev + 1))}
              disabled={pickerYear >= endYear}
              aria-label="翌年へ"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              ▶
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, idx) => {
              const monthNumber = idx + 1;
              const monthValue = `${pickerYear}-${String(monthNumber).padStart(2, "0")}`;
              const isSelected = pickerMonth === monthNumber;
              return (
                <button
                  type="button"
                  key={monthValue}
                  onClick={() => {
                    setPickerMonth(monthNumber);
                    handleMonthChange(monthValue);
                    setPickerOpen(false);
                  }}
                  className={`rounded px-2 py-2 text-xs font-semibold ${
                    isSelected ? "bg-black text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {monthNumber}
                </button>
              );
            })}
          </div>
          
        </div>
      )}
    </div>
  );

  // モバイルでもPCと同じデスクトップピッカーを使用
  // これにより、選択した瞬間に遷移し、確実に動作する

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-[150px] text-left">
              {desktopPicker}
            </div>
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

