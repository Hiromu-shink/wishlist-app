"use client";

import { useRouter } from "next/navigation";

const buttonBase = "h-10 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black";

export function SortSelector({ month, sort, className }: { month: string; sort: string; className?: string }) {
  const router = useRouter();
  
  return (
    <select
      aria-label="並び替え"
      className={className ?? buttonBase}
      value={sort}
      onChange={(e) => {
        const s = e.target.value;
        const params = new URLSearchParams();
        params.set("month", month);
        params.set("sort", s);
        router.push(`/?${params.toString()}`);
      }}
    >
      <option value="created-desc">新着順</option>
      <option value="priority-desc">優先度 ▼</option>
      <option value="priority-asc">優先度 ▲</option>
      <option value="price-desc">価格 ▼</option>
      <option value="price-asc">価格 ▲</option>
      <option value="deadline-asc">期限 ▲</option>
      <option value="deadline-desc">期限 ▼</option>
    </select>
  );
}

