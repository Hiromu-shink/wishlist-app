"use client";

import { useState, useRef, useEffect } from "react";
import { ListFilter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export type SortOption = 
  | "created-desc" 
  | "price-desc" 
  | "price-asc" 
  | "priority-desc" 
  | "deadline-asc";

export type DeadlineFilter = "this-month" | "next-month" | "within-3months" | "all";
export type PriceRangeFilter = "under-10k" | "10k-50k" | "50k-100k" | "over-100k" | "all";
export type PriorityFilter = "5" | "4+" | "3+" | "all";

export interface FilterState {
  sort: SortOption;
  deadline: DeadlineFilter;
  priceRange: PriceRangeFilter;
  priority: PriorityFilter;
}

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "created-desc", label: "新着順" },
  { value: "price-desc", label: "価格が高い順" },
  { value: "price-asc", label: "価格が低い順" },
  { value: "priority-desc", label: "優先度が高い順" },
  { value: "deadline-asc", label: "期限が近い順" },
];

const deadlineOptions: Array<{ value: DeadlineFilter; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "this-month", label: "今月" },
  { value: "next-month", label: "来月" },
  { value: "within-3months", label: "3ヶ月以内" },
];

const priceRangeOptions: Array<{ value: PriceRangeFilter; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "under-10k", label: "〜1万円" },
  { value: "10k-50k", label: "1〜5万円" },
  { value: "50k-100k", label: "5〜10万円" },
  { value: "over-100k", label: "10万円〜" },
];

const priorityOptions: Array<{ value: PriorityFilter; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "5", label: "★5" },
  { value: "4+", label: "★4以上" },
  { value: "3+", label: "★3以上" },
];

function parseFilterState(searchParams: URLSearchParams): FilterState {
  return {
    sort: (searchParams.get("sort") as SortOption) || "created-desc",
    deadline: (searchParams.get("deadline") as DeadlineFilter) || "all",
    priceRange: (searchParams.get("priceRange") as PriceRangeFilter) || "all",
    priority: (searchParams.get("priority") as PriorityFilter) || "all",
  };
}

function hasActiveFilters(state: FilterState): boolean {
  return state.deadline !== "all" || state.priceRange !== "all" || state.priority !== "all";
}

interface FilterMenuProps {
  currentPath?: string;
  preserveParams?: string[]; // 保持するパラメータ（例: month, q）
}

export function FilterMenu({ currentPath, preserveParams = [] }: FilterMenuProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>(() => parseFilterState(searchParams));
  const menuRef = useRef<HTMLDivElement | null>(null);

  // URLパラメータの変更を監視
  useEffect(() => {
    setFilterState(parseFilterState(searchParams));
  }, [searchParams]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function applyFilters(newState: Partial<FilterState>) {
    const updated = { ...filterState, ...newState };
    setFilterState(updated);
    
    const params = new URLSearchParams();
    
    // 既存のパラメータを保持
    preserveParams.forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });
    
    // フィルターパラメータを追加
    if (updated.sort !== "created-desc") params.set("sort", updated.sort);
    if (updated.deadline !== "all") params.set("deadline", updated.deadline);
    if (updated.priceRange !== "all") params.set("priceRange", updated.priceRange);
    if (updated.priority !== "all") params.set("priority", updated.priority);
    
    const path = currentPath || window.location.pathname;
    router.push(`${path}${params.toString() ? `?${params.toString()}` : ""}`);
    setIsOpen(false);
  }

  function clearFilters() {
    const params = new URLSearchParams();
    preserveParams.forEach((key) => {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    });
    const path = currentPath || window.location.pathname;
    router.push(`${path}${params.toString() ? `?${params.toString()}` : ""}`);
    setIsOpen(false);
  }

  const hasFilters = hasActiveFilters(filterState);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative text-gray-700 hover:text-blue-600 focus:outline-none ${
          hasFilters ? "text-blue-600" : ""
        }`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <ListFilter size={20} />
        {hasFilters && (
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-600 rounded-full" />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-h-[80vh] overflow-y-auto rounded-lg border bg-white shadow-lg">
          <div className="p-4 space-y-4">
            {/* ヘッダー */}
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-gray-900">フィルター</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* 並び替え */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">並び替え</label>
              <div className="space-y-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => applyFilters({ sort: option.value })}
                    className={`block w-full px-3 py-2 text-left text-sm rounded ${
                      filterState.sort === option.value
                        ? "bg-gray-100 font-semibold text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 期限 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">期限</label>
              <div className="space-y-1">
                {deadlineOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => applyFilters({ deadline: option.value })}
                    className={`block w-full px-3 py-2 text-left text-sm rounded ${
                      filterState.deadline === option.value
                        ? "bg-gray-100 font-semibold text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 価格帯 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">価格帯</label>
              <div className="space-y-1">
                {priceRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => applyFilters({ priceRange: option.value })}
                    className={`block w-full px-3 py-2 text-left text-sm rounded ${
                      filterState.priceRange === option.value
                        ? "bg-gray-100 font-semibold text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 優先度 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">優先度</label>
              <div className="space-y-1">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => applyFilters({ priority: option.value })}
                    className={`block w-full px-3 py-2 text-left text-sm rounded ${
                      filterState.priority === option.value
                        ? "bg-gray-100 font-semibold text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* クリアボタン */}
            {hasFilters && (
              <div className="pt-2 border-t">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded border"
                >
                  フィルターをクリア
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

