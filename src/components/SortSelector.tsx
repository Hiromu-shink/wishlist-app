"use client";

import { useRouter } from "next/navigation";

export function SortSelector({ month, sort }: { month: string; sort: string }) {
  const router = useRouter();
  
  return (
    <select
      className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
      value={sort}
      onChange={(e) => {
        const s = e.target.value;
        const params = new URLSearchParams();
        params.set("month", month);
        params.set("sort", s);
        router.push(`/?${params.toString()}`);
      }}
    >
      <option value="created">登録順</option>
      <option value="priority-desc">優先度(高い→低い)</option>
      <option value="priority-asc">優先度(低い→高い)</option>
      <option value="price-desc">金額(高い→低い)</option>
      <option value="price-asc">金額(低い→高い)</option>
      <option value="deadline-asc">期限(近い→遠い)</option>
      <option value="deadline-desc">期限(遠い→近い)</option>
    </select>
  );
}

