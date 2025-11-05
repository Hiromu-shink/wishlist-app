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
  const grayscale = item.is_purchased ? "grayscale" : "";

  return (
    <div className={`border rounded p-3 flex gap-3 ${grayscale}`}>
      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} className="object-cover w-full h-full" />
        ) : (
          <span className="text-xs text-gray-500 text-center p-2">{item.name}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium truncate">{item.name}</h3>
          <Stars n={item.priority} />
        </div>
        <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>価格: {item.price ?? '-'}円</span>
          <span>期限: {item.deadline ?? '-'}</span>
        </div>
        <div className="mt-2">
          <WishlistActions id={item.id} isPurchased={item.is_purchased} />
        </div>
        <WishlistQuickEdit id={item.id} price={item.price} deadline={item.deadline} priority={item.priority} />
      </div>
    </div>
  );
}

