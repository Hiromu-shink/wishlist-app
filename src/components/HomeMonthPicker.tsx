"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const startYear = 2025;
const totalYears = 50;
const endYear = startYear + totalYears - 1;

function currentYear() {
  const now = new Date();
  return now.getFullYear();
}

export function HomeMonthPicker() {
  const router = useRouter();
  const [pickerYear, setPickerYear] = useState(() => {
    const y = currentYear();
    if (y < startYear) return startYear;
    if (y > endYear) return endYear;
    return y;
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

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

  function handleMonthClick(monthValue: string) {
    router.push(`/?month=${monthValue}`);
    setPickerOpen(false);
  }

  return (
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
  );
}

