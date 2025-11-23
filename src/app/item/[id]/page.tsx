"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { getWishlistItemById, updateWishlistItem, deleteWishlistItem, fetchUrlMetadata } from "@/app/actions/wishlist";
import type { WishlistItem } from "@/types/wishlist";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/ToastProvider";
import { PriorityStars } from "@/components/PriorityStars";
import { Breadcrumb } from "@/components/Breadcrumb";

const buttonBase = "h-10 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black";
const buttonWhite = `${buttonBase} bg-white hover:bg-gray-50`;
const buttonBlack = `${buttonBase} bg-black text-white hover:bg-gray-800`;
const inputBase = "h-10 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black";
const removeBadge = "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-gray-600 shadow";

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
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { push } = useToast();
  const from = searchParams?.get("from");

  // guard for auth (client-side redirect fallback)
  // server page parent already protects, but keep UX safe
  
  const [item, setItem] = useState<WishlistItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [metadataPending, startMetadataTransition] = useTransition();
  const [metadataImageUrl, setMetadataImageUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  
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
    if (!file) {
      setUploadedPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setUploadedPreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const displayImage = uploadedPreview ?? metadataImageUrl ?? (form.image_url ? form.image_url : null);

  useEffect(() => {
    if (form.is_purchased && !form.purchased_date) {
      setForm((prev) => ({ ...prev, purchased_date: new Date().toISOString().slice(0, 10) }));
    }
  }, [form.is_purchased]);

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
        setMetadataImageUrl(null);
        setFile(null);
        setUploadedPreview(null);
      } catch (error: any) {
        push(error.message || "アイテムの取得に失敗しました");
        router.push("/");
      } finally {
        setLoading(false);
      }
    });
  }, [id, router, push]);

  function handleFetchMetadata() {
    if (!form.url) {
      setMetadataError("URLを入力してください");
      return;
    }
    startMetadataTransition(async () => {
      setMetadataError(null);
      const result = await fetchUrlMetadata({ url: form.url });
      if (!result.ok) {
        setMetadataError(result.error ?? "情報の取得に失敗しました");
        return;
      }
      const { title, price, imageUrl } = result.data;
      setForm((prev) => ({
        ...prev,
        name: title ?? prev.name,
        price: price !== null ? String(price) : prev.price,
        image_url: imageUrl ?? prev.image_url,
      }));
      setMetadataImageUrl(imageUrl ?? null);
      if (!title && price === null && !imageUrl) {
        setMetadataError("情報が見つかりませんでした");
      }
    });
  }

  function handleClearImage() {
    setFile(null);
    setUploadedPreview(null);
    setMetadataImageUrl(null);
    setForm((prev) => ({ ...prev, image_url: "" }));
  }

  async function handleUpdate() {
    if (!item) {
      push("アイテム情報の取得に失敗しました");
      return;
    }
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
        
        const isSomeday = form.is_someday;
        await updateWishlistItem(id, {
          name: form.name,
          price: form.price ? Number(form.price) : null,
          url: form.url || null,
          image_url: uploadedUrl ?? (metadataImageUrl ?? (form.image_url ? form.image_url : null)),
          comment: form.comment || null,
          deadline: isSomeday ? null : (form.deadline || null),
          priority: form.priority,
          is_purchased: form.is_purchased,
          purchased_date: form.is_purchased ? (form.purchased_date || null) : null,
          is_someday: isSomeday,
        });
        
        push("更新しました");
        setEditing(false);
        router.refresh();
        // データを再取得
        const data = await getWishlistItemById(id);
        const refreshed = data as WishlistItem;
        setItem(refreshed);
        setForm({
          name: refreshed.name || "",
          price: refreshed.price ? String(refreshed.price) : "",
          url: refreshed.url || "",
          image_url: refreshed.image_url || "",
          comment: refreshed.comment || "",
          deadline: refreshed.deadline || "",
          priority: refreshed.priority || 3,
          is_purchased: refreshed.is_purchased || false,
          purchased_date: refreshed.purchased_date || "",
          is_someday: refreshed.is_someday || false,
        });
        setMetadataImageUrl(null);
        setFile(null);
        setUploadedPreview(null);
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
        router.back();
      } catch (error: any) {
        push(error.message || "削除に失敗しました");
      }
    });
  }

  // パンくずリストの生成
  const breadcrumbItems = useMemo(() => {
    if (!item) return [];
    
    const items: Array<{ label: string; href?: string }> = [{ label: 'ホーム', href: '/' }];
    
    if (from === 'someday') {
      items.push({ label: 'いつか欲しいリスト', href: '/someday' });
    } else if (from) {
      // 月別ページ（例: 2025-11）
      try {
        const date = new Date(`${from}-01`);
        if (!isNaN(date.getTime())) {
          const monthName = date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
          items.push({ label: monthName, href: `/?month=${from}` });
        }
      } catch (e) {
        // 日付の解析に失敗した場合は無視
      }
    }
    
    items.push({ label: item.name });
    return items;
  }, [from, item]);

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
    <div className="container mx-auto px-4 py-6 space-y-6">
      {breadcrumbItems.length > 0 && (
        <Breadcrumb items={breadcrumbItems} />
      )}
      {!editing ? (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold break-words">{item.name}</h1>

          {item.image_url && (
            <div className="w-full bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.name} className="w-full h-auto object-contain max-h-96" />
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
              <p className="mt-1">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full max-w-full truncate text-sm text-blue-600 hover:underline"
                >
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
              <label className="text-sm text-gray-600">{item.is_purchased ? "購入" : "期限"}</label>
              <p>
                {item.is_purchased
                  ? (item.purchased_date ? new Date(item.purchased_date).toLocaleDateString("ja-JP") : "-")
                  : (item.deadline ? new Date(item.deadline).toLocaleDateString("ja-JP") : item.is_someday ? "未定" : "-")}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">状態</label>
              <p>{item.is_purchased ? "購入済み" : "未購入"}</p>
              {item.is_purchased && item.purchased_date && (
                <p className="text-xs text-gray-500">購入日: {item.purchased_date}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setEditing(true)}
              className={buttonWhite}
            >
              編集
            </button>
            <button
              onClick={handleDelete}
              className={`${buttonBase} border-red-500 text-red-600 hover:bg-red-50`}
            >
              削除
            </button>
          </div>
        </div>
      ) : (
        <form className="space-y-5 text-sm" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
          <div className="space-y-3">
            <div>
              <label className="block font-medium text-gray-700">登録名</label>
              <input
                className={`mt-1 w-full ${inputBase}`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700">価格</label>
              <input
                type="number"
                className={`mt-1 w-full ${inputBase}`}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700">優先度</label>
              <div className="mt-2">
                <PriorityStars value={form.priority} onChange={(value) => setForm({ ...form, priority: value })} />
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700">URL</label>
              <div className="mt-1 flex gap-2">
                <input
                  className={`w-full ${inputBase}`}
                  value={form.url}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm({ ...form, url: value });
                    setMetadataError(null);
                  }}
                />
                <button
                  type="button"
                  onClick={handleFetchMetadata}
                  className={`${buttonWhite} whitespace-nowrap disabled:opacity-60`}
                  disabled={metadataPending}
                >
                  {metadataPending ? "取得中..." : "自動入力"}
                </button>
              </div>
              {metadataError && <p className="mt-1 text-xs text-red-600">{metadataError}</p>}
            </div>

            <div>
              <label className="block font-medium text-gray-700">画像</label>
              <div className="mt-2 space-y-2">
                {displayImage ? (
                  <div className="relative w-48 h-48 overflow-hidden rounded border bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={displayImage} alt="プレビュー" className="h-full w-full object-cover object-center" />
                    <button type="button" className={removeBadge} onClick={handleClearImage}>
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="flex h-48 w-48 items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50 text-xs text-gray-500">
                    No Image
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className={`${buttonWhite} inline-flex cursor-pointer items-center gap-2`}>📷 画像を選択
                    <input
                      id="file_upload_edit"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const selected = e.target.files?.[0] ?? null;
                        setFile(selected);
                        setMetadataError(null);
                      }}
                      className="hidden"
                    />
                  </label>
                  {uploadedPreview && (
                    <button type="button" onClick={() => setFile(null)} className={buttonWhite}>
                      アップロードをクリア
                    </button>
                  )}
                </div>
                {metadataImageUrl && !uploadedPreview && (
                  <p className="text-xs text-gray-500">OGP 画像を使用中</p>
                )}
                {!metadataImageUrl && !uploadedPreview && form.image_url && (
                  <p className="text-xs text-gray-500">既存の画像を使用中</p>
                )}
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700">コメント</label>
              <textarea
                className="mt-1 w-full rounded border px-3 py-2"
                rows={4}
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700">期限 / 購入日</label>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <input
                  type="date"
                  className={`w-1/2 ${inputBase} text-right ${form.is_someday ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  disabled={form.is_someday || form.is_purchased}
                />
                <label className="inline-flex items-center gap-2 text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.is_someday}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        is_someday: e.target.checked,
                        deadline: e.target.checked ? "" : prev.deadline,
                      }))
                    }
                  />
                  未定
                </label>
                <label className="inline-flex items-center gap-2 text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.is_purchased}
                    onChange={(e) => setForm({ ...form, is_purchased: e.target.checked })}
                  />
                  購入済み
                </label>
              </div>
            </div>

            {form.is_purchased && (
              <div>
                <label className="block font-medium text-gray-700">購入日</label>
                <input
                  type="date"
                  className={`mt-1 w-1/2 ${inputBase} text-right`}
                  value={form.purchased_date}
                  onChange={(e) => setForm({ ...form, purchased_date: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className={buttonWhite}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={pending}
              className={`${buttonBlack} disabled:opacity-60`}
            >
              {pending ? "更新中..." : "更新"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

