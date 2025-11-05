"use client";

type SortKey = "created" | "priority-desc" | "priority-asc" | "price-desc" | "price-asc" | "deadline-asc" | "deadline-desc";

export type SortSelectValue = SortKey;

export function SortSelect({ value, onChange }: { value: SortSelectValue; onChange: (v: SortSelectValue) => void }) {
  return (
    <select
      className="border rounded px-2 py-1 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value as SortSelectValue)}
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

