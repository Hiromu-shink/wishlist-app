"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HomeMonthPicker } from "@/components/HomeMonthPicker";
import { FilterMenu } from "@/components/FilterMenu";
import { filterItems, sortItems } from "@/lib/filters";
import type { WishlistItem } from "@/types/wishlist";

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "¥-";
  return `¥${price.toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ja-JP");
}

export function AllItemsClient({ initialItems }: { initialItems: WishlistItem[] }) {
  const searchParams = useSearchParams();
  
  const sort = (searchParams.get("sort") as any) || "created-desc";
  const deadline = (searchParams.get("deadline") as any) || "all";
  const priceRange = (searchParams.get("priceRange") as any) || "all";
  const priority = (searchParams.get("priority") as any) || "all";

  const filteredAndSorted = useMemo(() => {
    let items = [...initialItems];
    
    // フィルター適用
    items = filterItems(items, { deadline, priceRange, priority });
    
    // 並び替え適用
    items = sortItems(items, sort);
    
    return items;
  }, [initialItems, sort, deadline, priceRange, priority]);

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Wishlist</h1>
          <p className="text-gray-600">Total: {filteredAndSorted.length}</p>
        </div>
        <FilterMenu preserveParams={[]} />
      </div>

      <HomeMonthPicker />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {filteredAndSorted.map((item) => (
          <Link
            key={item.id}
            href={`/item/${item.id}`}
            className="border border-[#dddddd] rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white flex flex-col"
          >
            {/* 画像 */}
            <div className="relative h-32 overflow-hidden bg-white">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs text-gray-400">No Image</span>
                </div>
              )}
            </div>

            {/* 商品名 */}
            <div className="p-2 flex-1 flex flex-col">
              <h3 className="text-sm font-bold line-clamp-2 mb-1 text-[#333] min-h-[2.5rem]">
                {item.name}
              </h3>

              {/* 価格 */}
              {item.price && (
                <p className="text-xs text-black font-semibold mb-1">
                  {formatPrice(item.price)}
                </p>
              )}

              {/* 優先度 */}
              <div className="flex gap-0.5 text-xs text-[#FFD700] mb-1" aria-label={`優先度 ${item.priority}`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>{i < item.priority ? "★" : "☆"}</span>
                ))}
              </div>

              {/* 期限 */}
              {item.deadline ? (
                <p className="text-xs text-[#666]">
                  {formatDate(item.deadline) ?? "-"}
                </p>
              ) : (
                <p className="text-xs text-[#666]">期限: 未定</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filteredAndSorted.length === 0 && (
        <div className="text-center text-gray-400 mt-8">
          欲しいものがまだありません
        </div>
      )}
    </div>
  );
}

