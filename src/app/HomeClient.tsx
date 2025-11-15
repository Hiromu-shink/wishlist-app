"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getWishlistItems } from "@/app/actions/wishlist";
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
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const fallbackMonth = useMemo(() => currentMonth(), []);
  const fallbackYear = useMemo(() => Number(fallbackMonth.split("-")[0]), [fallbackMonth]);
  const [pickerYear, setPickerYear] = useState(() => {
    const source = isSomeday ? fallbackMonth : month;
    const y = Number(source.split("-")[0]);
    return Number.isFinite(y) ? y : fallbackYear;
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (!source.includes("-")) return;
    const y = Number(source.split("-")[0]);
    if (Number.isFinite(y)) {
      setPickerYear(() => {
        if (y < startYear) return startYear;
        if (y > endYear) return endYear;
        return y;
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

  const desktopPicker = (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        className={`${buttonBase} w-full flex items-center justify-between gap-2`}
        onClick={() => setPickerOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={pickerOpen}
      >
        <span className="text-base font-semibold">{pickerYear}</span>
        <span className="text-xs text-gray-500">▾▴</span>
      </button>
      {pickerOpen && (
        <div className="absolute left-0 z-40 mt-2 w-56 rounded-xl border bg-white p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className={`${buttonBase} w-16 py-1 text-sm`}
              onClick={() => setPickerYear((prev) => Math.min(endYear, prev + 1))}
              disabled={pickerYear >= endYear}
            >
              ▲
            </button>
            <div className="text-lg font-semibold">{pickerYear}</div>
            <button
              type="button"
              className={`${buttonBase} w-16 py-1 text-sm`}
              onClick={() => setPickerYear((prev) => Math.max(startYear, prev - 1))}
              disabled={pickerYear <= startYear}
            >
              ▼
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, idx) => {
              const monthNumber = idx + 1;
              const monthValue = `${pickerYear}-${String(monthNumber).padStart(2, "0")}`;
              const isSelected = !isSomeday && month === monthValue;
              return (
                <button
                  type="button"
                  key={monthValue}
                  onClick={() => {
                    handleMonthChange(monthValue);
                    setPickerOpen(false);
                  }}
                  className={`rounded border px-2 py-1 text-sm ${
                    isSelected ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {monthNumber.toString().padStart(2, "0")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const mobilePicker = isSomeday ? (
    <div className="relative">
      <button
        type="button"
        className={`${buttonBase} w-full flex items-center justify-between gap-2`}
        onClick={() => {
          mobileInputRef.current?.showPicker?.();
          mobileInputRef.current?.focus();
        }}
      >
        <span className="text-base font-semibold">{pickerYear}</span>
        <span className="text-xs text-gray-500">▾▴</span>
      </button>
      <input
        ref={mobileInputRef}
        type="month"
        className="absolute inset-0 h-full w-full opacity-0"
        value=""
        min="2025-01"
        max="2074-12"
        aria-label="年月を選択"
        onChange={(e) => {
          if (e.target.value) {
            handleMonthChange(e.target.value);
          }
        }}
      />
    </div>
  ) : (
    <div className="relative">
      <input
        type="month"
        className={`${buttonBase} w-full`}
        value={month}
        min="2025-01"
        max="2074-12"
        list="month-options"
        aria-label="年月を選択"
        onChange={(e) => handleMonthChange(e.target.value)}
      />
      <datalist id="month-options">
        {monthOptions.map((option) => (
          <option value={option} key={option} />
        ))}
      </datalist>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-[150px] text-left">
              {isTouchDevice ? mobilePicker : desktopPicker}
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

