"use client";

import { useRouter } from "next/navigation";
import { WishlistItem } from "@/types/wishlist";
import { WishlistActions } from "@/components/WishlistActions";
import { WishlistQuickEdit } from "@/components/WishlistQuickEdit";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`優先度 ${n}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < n ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

export function WishlistCard({ item }: { item: WishlistItem }) {
  const router = useRouter();
  const grayscale = item.is_purchased ? "grayscale" : "";

  const handleCardClick = (e: React.MouseEvent) => {
    // ボタンや入力欄をクリックした場合は遷移しない
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.closest('button') || target.closest('input')) {
      return;
    }
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
          <img src={item.image_url} alt={item.name} className="object-cover w-full h-full pointer-events-none" />
        ) : (
          <span className="text-xs text-gray-500 text-center p-2 pointer-events-none">{item.name}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium truncate pointer-events-none">{item.name}</h3>
          <div className="pointer-events-none">
            <Stars n={item.priority} />
          </div>
        </div>
        <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1 pointer-events-none">
          <span>価格: {item.price ?? '-'}円</span>
          <span>期限: {item.deadline ?? '-'}</span>
        </div>
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <WishlistActions id={item.id} isPurchased={item.is_purchased} />
        </div>
        <WishlistQuickEdit id={item.id} price={item.price} deadline={item.deadline} priority={item.priority} />
      </div>
    </div>
  );
}

