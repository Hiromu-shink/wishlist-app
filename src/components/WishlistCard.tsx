"use client";

import { useRouter } from "next/navigation";
import { WishlistItem } from "@/types/wishlist";

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

export function WishlistCard({ item, referrerMonth }: { item: WishlistItem; referrerMonth?: string }) {
  const router = useRouter();
  const grayscale = item.is_purchased ? "grayscale" : "";
  const deadlineLabel = item.is_someday ? "未定" : (item.deadline ?? "-");

  const handleCardClick = () => {
    const params = new URLSearchParams();
    if (referrerMonth) {
      params.set("from", referrerMonth);
    }
    const query = params.toString();
    router.push(`/item/${item.id}${query ? `?${query}` : ""}`);
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
        <div className="relative w-full h-[200px] overflow-hidden rounded-md bg-[#f0f0f0]">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover object-center" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-[#999]">
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
            <span className="text-sm text-[#666]">期限: {deadlineLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

