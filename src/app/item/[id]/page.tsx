"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { getWishlistItemById, updateWishlistItem, deleteWishlistItem } from "@/app/actions/wishlist";
import type { WishlistItem } from "@/types/wishlist";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";
import { PriorityStars } from "@/components/PriorityStars";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`優先度 ${n}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-lg">{i < n ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

export default function ItemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { push } = useToast();
  
  const [item, setItem] = useState<WishlistItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  
  const [form, setForm] = useState({
    name: "",
    price: "",
    url: "",
    image_url: "",
    comment: "",
    deadline: "",
    priority: 3,
    is_purchased: false,
    purchased_date: "",
    is_someday: false,
  });

  useEffect(() => {
    if (!id) return;
    startTransition(async () => {
      try {
        const data = await getWishlistItemById(id);
        setItem(data as WishlistItem);
        setForm({
          name: data.name || "",
          price: data.price ? String(data.price) : "",
          url: data.url || "",
          image_url: data.image_url || "",
          comment: data.comment || "",
          deadline: data.deadline || "",
          priority: data.priority || 3,
          is_purchased: data.is_purchased || false,
          purchased_date: data.purchased_date || "",
          is_someday: data.is_someday || false,
        });
      } catch (error: any) {
        push(error.message || "アイテムの取得に失敗しました");
        router.push("/");
      } finally {
        setLoading(false);
      }
    });
  }, [id, router, push]);

  async function handleUpdate() {
    if (!item) {
      push("アイテム情報の取得に失敗しました");
      return;
    }
    const currentItem = item;
    startTransition(async () => {
      try {
        let uploadedUrl: string | null = null;
        if (file) {
          try {
            const supabase = getSupabaseBrowser();
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const path = `public/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
            const { error: upErr } = await supabase.storage.from('wishlist').upload(path, file, { upsert: true, contentType: file.type });
            if (!upErr) {
              const { data: pub } = supabase.storage.from('wishlist').getPublicUrl(path);
              uploadedUrl = pub.publicUrl;
            }
          } catch {
            // アップロード失敗時は無視
          }
        }
        
        await updateWishlistItem(id, {
          name: form.name,
          price: form.price ? Number(form.price) : null,
          url: form.url || null,
          image_url: uploadedUrl || (form.image_url || null),
          comment: form.comment || null,
          deadline: currentItem.is_someday ? null : (form.deadline || null),
          priority: form.priority,
          is_purchased: form.is_purchased,
          purchased_date: form.is_purchased ? (form.purchased_date || null) : null,
          is_someday: currentItem.is_someday, // 編集画面では変更不可（新規登録時のみ設定可能）
        });
        
        push("更新しました");
        setEditing(false);
        router.refresh();
        // データを再取得
        const data = await getWishlistItemById(id);
        setItem(data as WishlistItem);
      } catch (error: any) {
        push(error.message || "更新に失敗しました");
      }
    });
  }

  async function handleDelete() {
    if (!confirm("本当に削除しますか？")) return;
    startTransition(async () => {
      try {
        await deleteWishlistItem(id);
        push("削除しました");
        router.push("/");
      } catch (error: any) {
        push(error.message || "削除に失敗しました");
      }
    });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-red-600">アイテムが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{item.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            {editing ? "キャンセル" : "編集"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            トップへ戻る
          </button>
        </div>
      </div>

      {!editing ? (
        <div className="space-y-4">
          {item.image_url && (
            <div className="w-full h-64 bg-gray-100 rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.name} className="object-cover w-full h-full" />
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">価格</label>
              <p className="text-lg font-semibold">{item.price ? `${item.price.toLocaleString()}円` : "-"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">優先度</label>
              <Stars n={item.priority} />
            </div>
          </div>

          {item.url && (
            <div>
              <label className="text-sm text-gray-600">URL</label>
              <p>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {item.url}
                </a>
              </p>
            </div>
          )}

          {item.comment && (
            <div>
              <label className="text-sm text-gray-600">コメント</label>
              <p className="whitespace-pre-wrap">{item.comment}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">期限</label>
              <p>{item.deadline || (item.is_someday ? "未定" : "-")}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">状態</label>
              <p>{item.is_purchased ? "購入済み" : "未購入"}</p>
              {item.is_purchased && item.purchased_date && (
                <p className="text-xs text-gray-500">購入日: {item.purchased_date}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleDelete}
              className="px-4 py-2 border rounded bg-red-50 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              削除
            </button>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
          <div>
            <label className="block text-sm mb-1">登録名 *</label>
            <input className="w-full border rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          
          <div>
            <label className="block text-sm mb-1">価格</label>
            <input type="number" className="w-full border rounded px-3 py-2" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          
          <div>
            <label className="block text-sm mb-1">優先度</label>
            <PriorityStars value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} />
          </div>

          <div>
            <label className="block text-sm mb-1">URL</label>
            <input className="w-full border rounded px-3 py-2" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm mb-1">画像URL</label>
            <input className="w-full border rounded px-3 py-2" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </div>

          <div>
            <label htmlFor="file_upload_edit" className="block text-sm mb-1">画像アップロード</label>
            <label htmlFor="file_upload_edit" className="block w-full border-2 border-dashed border-gray-300 rounded px-4 py-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
              <input 
                id="file_upload_edit" 
                type="file" 
                accept="image/*" 
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} 
                className="hidden"
              />
              <span className="text-sm text-gray-600">
                {file ? file.name : "ファイルを選択"}
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm mb-1">コメント</label>
            <textarea className="w-full border rounded px-3 py-2" rows={4} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm mb-1 ${item.is_someday ? "text-gray-400" : ""}`}>期限</label>
              <input 
                type="date" 
                className={`w-full border rounded px-3 py-2 ${item.is_someday ? "bg-gray-100 cursor-not-allowed" : ""}`}
                value={form.deadline} 
                onChange={(e) => setForm({ ...form, deadline: e.target.value })} 
                disabled={item.is_someday}
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="inline-flex items-center gap-2 text-gray-600">
                <input type="checkbox" checked={item.is_someday} disabled className="rounded" />
                未定
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={form.is_purchased} onChange={(e) => setForm({ ...form, is_purchased: e.target.checked })} />
                購入済み
              </label>
            </div>
          </div>

          {form.is_purchased && (
            <div>
              <label className="block text-sm mb-1">購入日</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={form.purchased_date} onChange={(e) => setForm({ ...form, purchased_date: e.target.value })} />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 border rounded disabled:opacity-60"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 border rounded bg-black text-white disabled:opacity-60"
            >
              {pending ? "更新中..." : "更新"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

