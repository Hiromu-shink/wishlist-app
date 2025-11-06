"use client";

import { useRouter } from "next/navigation";
import { WishlistItem } from "@/types/wishlist";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`優先度 ${n}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-lg">{i < n ? "★" : "☆"}</span>
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

  const handleCardClick = () => {
    router.push(`/item/${item.id}`);
  };

  return (
    <div 
      className={`border rounded p-3 flex gap-3 ${grayscale} cursor-pointer hover:bg-gray-50 transition-colors`}
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
      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} className="object-cover w-full h-full" />
        ) : (
          <span className="text-xs text-gray-500 text-center p-2">{item.name}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-medium truncate">{item.name}</h3>
          <Stars n={item.priority} />
        </div>
        <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
          <span>{formatPrice(item.price)}</span>
          <span>期限: {item.deadline ?? '-'}</span>
        </div>
      </div>
    </div>
  );
}

