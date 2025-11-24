"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { WishlistItem } from "@/types/wishlist";
import { togglePurchased } from "@/app/actions/wishlist";
import { useToast } from "@/components/ui/ToastProvider";

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
  const { push } = useToast();
  const [pending, startTransition] = useTransition();
  const grayscale = item.is_purchased ? "grayscale" : "";
  const deadlineLabel = item.is_someday ? "未定" : (item.deadline ?? "-");
  const showUnpurchaseButton = from === "purchased" && item.is_purchased;

  const handleCardClick = () => {
    const url = from ? `/item/${item.id}?from=${encodeURIComponent(from)}` : `/item/${item.id}`;
    router.push(url);
  };

  const handleUnpurchase = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      try {
        await togglePurchased(item.id, false);
        push("購入済みを解除しました");
        router.refresh();
      } catch (error: any) {
        push(error.message || "解除に失敗しました");
      }
    });
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
        <div className="relative w-full h-[200px] overflow-hidden rounded-md bg-white">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
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
            <span className="text-sm text-[#666]">
              {item.is_purchased
                ? `購入: ${formatDate(item.purchased_date) ?? "-"}`
                : item.deadline
                ? `期限: ${formatDate(item.deadline)}`
                : "期限: 未定"}
            </span>
            {showUnpurchaseButton && (
              <button
                onClick={handleUnpurchase}
                disabled={pending}
                className="mt-2 px-3 py-1 border rounded text-xs disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-black hover:bg-gray-50"
              >
                {pending ? "処理中..." : "購入済みを解除"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

