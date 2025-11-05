"use client";

import { useState, useTransition } from "react";
import { updateWishlistItem } from "@/app/actions/wishlist";
import { useToast } from "@/components/ui/ToastProvider";

export function WishlistQuickEdit({ id, price, deadline, priority }: { id: string; price: number | null; deadline: string | null; priority: number }) {
  const [v, setV] = useState({
    price: price !== null && price !== undefined ? String(price) : "",
    deadline: deadline ?? "",
    priority: priority,
  });
  const [pending, startTransition] = useTransition();
  const { push } = useToast();

  function save() {
    startTransition(async () => {
      try {
        await updateWishlistItem(id, {
          price: v.price.trim() === '' ? null : Number(v.price),
          deadline: v.deadline || null,
          priority: v.priority,
        });
        push("更新しました");
      } catch (e: any) {
        push(e.message ?? "更新に失敗しました");
      }
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-end gap-2 text-sm">
      <label className="flex items-center gap-1">
        <span className="text-gray-600">価格</span>
        <input type="number" className="w-28 border rounded px-2 py-1" value={v.price} onChange={(e) => setV({ ...v, price: Number(e.target.value) })} />
      </label>
      <label className="flex items-center gap-1">
        <span className="text-gray-600">期限</span>
        <input type="date" className="border rounded px-2 py-1" value={v.deadline} onChange={(e) => setV({ ...v, deadline: e.target.value })} />
      </label>
      <label className="flex items-center gap-1">
        <span className="text-gray-600">優先度</span>
        <input type="range" min={1} max={5} value={v.priority} onChange={(e) => setV({ ...v, priority: Number(e.target.value) })} />
      </label>
      <button onClick={save} disabled={pending} className="px-3 py-1 border rounded disabled:opacity-60">{pending ? "保存中..." : "保存"}</button>
    </div>
  );
}

