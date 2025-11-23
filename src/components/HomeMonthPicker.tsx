"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown, ListFilter } from "lucide-react";

const startYear = 2025;
const totalYears = 50;
const endYear = startYear + totalYears - 1;

function currentYear() {
  const now = new Date();
  return now.getFullYear();
}

export function HomeMonthPicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") || "created-desc";
  const [pickerYear, setPickerYear] = useState(() => {
    const y = currentYear();
    if (y < startYear) return startYear;
    if (y > endYear) return endYear;
    return y;
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

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
    if (!showFilterMenu) return;
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterMenu]);

  function handleMonthClick(monthValue: string) {
    router.push(`/?month=${monthValue}`);
    setPickerOpen(false);
  }

  function handleSortChange(newSort: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    router.push(`/?${params.toString()}`);
    setShowFilterMenu(false);
  }

  const sortOptions = [
    { value: "created-desc", label: "新着順" },
    { value: "priority-desc", label: "優先度 ▼" },
    { value: "priority-asc", label: "優先度 ▲" },
    { value: "price-desc", label: "価格 ▼" },
    { value: "price-asc", label: "価格 ▲" },
    { value: "deadline-asc", label: "期限 ▲" },
    { value: "deadline-desc", label: "期限 ▼" },
  ];

  return (
    <div className="flex justify-between items-center mb-4">
      {/* 月選択 */}
      <div className="relative" ref={pickerRef}>
        {/* プルダウンボタン */}
        <button
          type="button"
          onClick={() => setPickerOpen((prev) => !prev)}
          className="flex items-center gap-1 text-gray-700 hover:text-blue-600 focus:outline-none"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
        >
          <span className="font-medium">{pickerYear}</span>
          {pickerOpen ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>
        
        {/* カレンダー（開いてる時だけ表示） */}
        {pickerOpen && (
          <div className="absolute left-0 z-40 mt-2 w-[220px] rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            {/* 年の切り替え */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setPickerYear((prev) => Math.max(startYear, prev - 1))}
                disabled={pickerYear <= startYear}
                className="rounded px-3 py-2 text-base font-semibold hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                aria-label="前年へ"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              <button
                type="button"
                onClick={() => {
                  router.push('/');
                  setPickerOpen(false);
                }}
                className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
              >
                {pickerYear}年
              </button>
              <button
                type="button"
                onClick={() => setPickerYear((prev) => Math.min(endYear, prev + 1))}
                disabled={pickerYear >= endYear}
                className="rounded px-3 py-2 text-base font-semibold hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                aria-label="翌年へ"
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>
            </div>
            
            {/* 月の選択 */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                const monthValue = `${pickerYear}-${String(m).padStart(2, '0')}`;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMonthClick(monthValue)}
                    className="px-3 py-2 hover:bg-blue-50 rounded text-xs font-semibold"
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* フィルター */}
      <div className="relative" ref={filterRef}>
        <button
          type="button"
          onClick={() => setShowFilterMenu((prev) => !prev)}
          className="text-gray-700 hover:text-blue-600"
          aria-haspopup="menu"
          aria-expanded={showFilterMenu}
        >
          <ListFilter size={20} />
        </button>
        {showFilterMenu && (
          <div className="absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-lg border bg-white shadow-lg">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSortChange(option.value)}
                className={`block w-full px-4 py-2 text-left text-sm ${
                  sort === option.value
                    ? "bg-gray-100 font-semibold text-gray-900"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

