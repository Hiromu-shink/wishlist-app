"use client";

import { useRouter } from "next/navigation";
import { WishlistItem } from "@/types/wishlist";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 text-lg" aria-label={`優先度 ${n}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < n ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return "-";
  return `¥${price.toLocaleString()}`;
}

export function WishlistCard({ item }: { item: WishlistItem }) {
  const router = useRouter();
  const grayscale = item.is_purchased ? "grayscale" : "";
  const deadlineLabel = item.is_someday ? "未定" : (item.deadline ?? "-");

  const handleCardClick = () => {
    router.push(`/item/${item.id}`);
  };

  return (
    <div
      className={`h-full border rounded-xl bg-white flex flex-col overflow-hidden ${grayscale} cursor-pointer shadow-sm hover:shadow-md transition`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/item/${item.id}`);
        }
      }}
    >
      <div className="relative aspect-square bg-gray-100">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} className="object-cover w-full h-full" />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-3 text-xs text-gray-500 text-center">
            {item.name}
          </div>
        )}
      </div>
      <div className="flex-1 px-3 py-4 flex flex-col gap-2">
        <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{item.name}</h3>
        <span className="text-base font-semibold text-gray-900">{formatPrice(item.price)}</span>
        <div>
          <Stars n={item.priority} />
        </div>
        <span className="text-xs text-gray-600">期限: {deadlineLabel}</span>
      </div>
    </div>
  );
}

