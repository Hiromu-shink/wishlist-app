"use client";

import { useTransition } from "react";
import { deleteWishlistItem, togglePurchased } from "@/app/actions/wishlist";

export function WishlistActions({ id, isPurchased }: { id: string; isPurchased: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <button
        aria-label={isPurchased ? "未購入に戻す" : "購入済みにする"}
        className="px-2 py-1 border rounded text-xs disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        disabled={pending}
        onClick={(e) => {
          e.stopPropagation();
          startTransition(() => togglePurchased(id, !isPurchased));
        }}
      >
        {isPurchased ? "未購入に戻す" : "購入済みにする"}
      </button>
      <button
        aria-label="削除"
        className="px-2 py-1 border rounded text-xs disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        disabled={pending}
        onClick={(e) => {
          e.stopPropagation();
          startTransition(() => deleteWishlistItem(id));
        }}
      >
        削除
      </button>
    </div>
  );
}

