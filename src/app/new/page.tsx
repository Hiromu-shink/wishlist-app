"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { createWishlistItem, fetchUrlMetadata } from "@/app/actions/wishlist";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PriorityStars } from "@/components/PriorityStars";

const schema = z.object({
  name: z.string().min(1, "必須です"),
  price: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  comment: z.string().optional(),
  deadline: z.string().optional(),
  priority: z.number().min(1).max(5),
  is_purchased: z.boolean().default(false),
  purchased_date: z.string().optional(),
});

export default function NewPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    price: "",
    url: "",
    comment: "",
    deadline: "",
    priority: 3,
    is_purchased: false,
    purchased_date: "",
    is_someday: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [metadataPending, startMetadataTransition] = useTransition();
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [metadataImageUrl, setMetadataImageUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

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
        name: prev.name || title || prev.name,
        price: prev.price || (price !== null ? String(price) : ""),
      }));
      setMetadataImageUrl(imageUrl ?? null);

      if (!title && price === null && !imageUrl) {
        setMetadataError("情報が見つかりませんでした");
      }
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "入力エラー");
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
            console.log('Uploading file:', { name: file.name, size: file.size, type: file.type, path });
            
            const { error: upErr, data: uploadData } = await supabase.storage.from('wishlist').upload(path, file, { 
              upsert: true, 
              contentType: file.type,
              cacheControl: '3600',
            });
            
            if (upErr) {
              console.error('Upload error:', upErr);
              setError(`画像アップロードに失敗しました: ${upErr.message}`);
              return;
            }
            
            if (uploadData) {
              const { data: pub } = supabase.storage.from('wishlist').getPublicUrl(path);
              uploadedUrl = pub.publicUrl;
              console.log('Image uploaded successfully:', uploadedUrl);
              console.log('Public URL:', pub);
            } else {
              console.warn('Upload data is null');
            }
          } catch (uploadError: any) {
            console.error('Upload failed:', uploadError);
            setError(uploadError.message || "画像アップロードに失敗しました");
            return;
          }
        }
        await createWishlistItem({
          name: form.name,
          price: form.price ? Number(form.price) : null,
          url: form.url || null,
          image_url: uploadedUrl || metadataImageUrl || null,
          comment: form.comment || null,
          deadline: form.is_someday ? null : (form.deadline || null),
          priority: form.priority,
          is_purchased: form.is_purchased,
          purchased_date: form.is_purchased ? (form.purchased_date || null) : null,
          is_someday: form.is_someday,
        });
        const d = form.deadline ? new Date(form.deadline) : new Date();
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        router.push(`/?month=${month}`);
        router.refresh();
      } catch (err: any) {
        setError(err.message ?? "登録に失敗しました");
      }
    });
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">欲しいもの登録</h1>
        <button type="button" onClick={() => router.push('/')} className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
          トップへ戻る
        </button>
      </div>
      <form className="space-y-5 text-sm" onSubmit={onSubmit}>
        <div className="space-y-3">
          <div>
            <label htmlFor="name" className="block font-medium text-gray-700">登録名</label>
            <input
              id="name"
              name="name"
              className="mt-1 w-full rounded border px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="price" className="block font-medium text-gray-700">価格</label>
            <input
              id="price"
              name="price"
              type="number"
              className="mt-1 w-full rounded border px-3 py-2"
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
            <label htmlFor="url" className="block font-medium text-gray-700">URL</label>
            <div className="mt-1 flex gap-2">
              <input
                id="url"
                name="url"
                className="w-full rounded border px-3 py-2"
                value={form.url}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({ ...prev, url: value }));
                  setMetadataError(null);
                  setMetadataImageUrl(null);
                }}
              />
              <button
                type="button"
                onClick={handleFetchMetadata}
                className="whitespace-nowrap rounded border px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
                disabled={metadataPending}
              >
                {metadataPending ? "取得中..." : "自動入力"}
              </button>
            </div>
            {metadataError && <p className="mt-1 text-xs text-red-600">{metadataError}</p>}
          </div>

          <div>
            <label htmlFor="file_upload" className="block font-medium text-gray-700">画像アップロード</label>
            <label htmlFor="file_upload" className="mt-1 block w-full cursor-pointer rounded border-2 border-dashed border-gray-300 px-4 py-6 text-center text-gray-600 hover:border-gray-400">
              <input
                id="file_upload"
                name="file_upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null;
                  setFile(selected);
                  if (selected) setMetadataImageUrl(null);
                }}
                className="hidden"
              />
              <span className="text-xs">{file ? file.name : "ファイルを選択"}</span>
            </label>
          </div>

          <div>
            <label htmlFor="comment" className="block font-medium text-gray-700">コメント</label>
            <textarea
              id="comment"
              name="comment"
              className="mt-1 w-full rounded border px-3 py-2"
              rows={4}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">期限</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                id="deadline"
                name="deadline"
                type="date"
                className={`w-full rounded border px-3 py-2 ${form.is_someday ? "bg-gray-100 cursor-not-allowed" : ""}`}
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                disabled={form.is_someday}
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
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded border px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-black"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded border bg-black px-4 py-2 font-medium text-white focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
          >
            {pending ? "送信中..." : "登録"}
          </button>
        </div>
      </form>

