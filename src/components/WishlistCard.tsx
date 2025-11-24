"use client";

import { useRouter } from "next/navigation";
import { WishlistItem } from "@/types/wishlist";
import { ItemImage } from "@/components/ItemImage";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-1 text-base text-[#FFD700]" aria-label={`優先度 ${n}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < n ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

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

export function WishlistCard({ item, from }: { item: WishlistItem; from?: string }) {
  const router = useRouter();
  const grayscale = item.is_purchased ? "grayscale" : "";
  const deadlineLabel = item.is_someday ? "未定" : (item.deadline ?? "-");

  const handleCardClick = () => {
    const url = from ? `/item/${item.id}?from=${encodeURIComponent(from)}` : `/item/${item.id}`;
    router.push(url);
  };

  return (
    <div
      className={`border border-[#dddddd] rounded-lg bg-white overflow-hidden ${grayscale} cursor-pointer shadow-sm hover:shadow-md transition flex flex-col`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="flex h-full flex-col p-4 text-left">
        <div className="relative w-full h-[200px] overflow-hidden rounded-md">
          {item.image_url ? (
            <ItemImage
              imageUrl={item.image_url}
              alt={item.name}
              className="h-full w-full object-contain object-center p-2"
              containerClassName="h-[200px] rounded-md"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-[#999] bg-white">
              No Image
            </div>
          )}
        </div>
        <div className="mt-3 flex-1 flex flex-col">
          <h3 className="text-base font-bold leading-snug text-[#333] line-clamp-2 min-h-[3.25rem]">
            {item.name}
          </h3>
          <div className="mt-auto space-y-2">
            <span className="text-lg font-bold text-black">{formatPrice(item.price)}</span>
            <Stars n={item.priority} />
            <span className="text-sm text-[#666]">
              {item.is_purchased
                ? `購入: ${formatDate(item.purchased_date) ?? "-"}`
                : item.deadline
                ? `期限: ${formatDate(item.deadline)}`
                : "期限: 未定"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

