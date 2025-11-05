"use client";

import { useMemo } from "react";

type MonthTabsProps = {
  currentMonth: string;
  onChange: (month: string) => void;
  months?: string[];
};

export function MonthTabs({ currentMonth, onChange, months }: MonthTabsProps) {
  const monthList = useMemo(() => {
    if (months && months.length > 0) return months;
    const now = new Date();
    const around = [-2, -1, 0, 1, 2];
    return around.map((d) => {
      const dt = new Date(now.getFullYear(), now.getMonth() + d, 1);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}`;
    });
  }, [months]);

  return (
    <div className="flex gap-2 flex-wrap">
      {monthList.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-3 py-1 rounded border text-sm ${
            m === currentMonth ? "bg-black text-white" : "bg-white"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

