"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const buttonBase = "h-10 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black";
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

  const desktopPicker = (
    <div className="relative w-full" ref={pickerRef}>
      <button
        type="button"
        className={`${buttonBase} w-full flex items-center justify-center gap-3 font-semibold`}
        onClick={() => setPickerOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={pickerOpen}
      >
        <span className="text-base tracking-wide">{pickerYear}年</span>
        <ChevronDown size={20} className="text-gray-700" />
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
            >
              <ChevronLeft size={20} className="text-gray-700" />
            </button>
            <div className="text-base font-semibold text-gray-900">{pickerYear}年</div>
            <button
              type="button"
              className="rounded px-3 py-2 text-base font-semibold hover:bg-gray-100 disabled:text-gray-400"
              onClick={() => setPickerYear((prev) => Math.min(endYear, prev + 1))}
              disabled={pickerYear >= endYear}
              aria-label="翌年へ"
            >
              <ChevronRight size={20} className="text-gray-700" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, idx) => {
              const monthNumber = idx + 1;
              const monthValue = `${pickerYear}-${String(monthNumber).padStart(2, "0")}`;
              return (
                <button
                  type="button"
                  key={monthValue}
                  onClick={() => handleMonthClick(monthValue)}
                  className="rounded px-2 py-2 text-xs font-semibold hover:bg-gray-100"
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

  return (
    <div className="mb-4">
      <div className="flex-shrink-0 w-[150px] text-left">
        {desktopPicker}
      </div>
    </div>
  );
}

