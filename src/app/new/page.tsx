"use client";

import { useState, useTransition, useEffect } from "react";
import { z } from "zod";
import { createWishlistItem, fetchUrlMetadata } from "@/app/actions/wishlist";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PriorityStars } from "@/components/PriorityStars";

const buttonBase = "h-10 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black";
const buttonWhite = `${buttonBase} bg-white hover:bg-gray-50`;
const buttonBlack = `${buttonBase} bg-black text-white hover:bg-gray-800`;
const inputBase = "h-10 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black";
const removeBadge = "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-gray-600 shadow";

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
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  const displayImage = uploadedPreview ?? metadataImageUrl ?? (form.image_url ? form.image_url : null);

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
        router.push("/");
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
              className={`mt-1 w-full ${inputBase}`}
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
            <label htmlFor="url" className="block font-medium text-gray-700">URL</label>
            <div className="mt-1 flex gap-2">
              <input
                id="url"
                name="url"
                className={`w-full ${inputBase}`}
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
                  {uploadedPreview && (
                    <button
                      type="button"
                      className={removeBadge}
                      onClick={() => setFile(null)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50 text-xs text-gray-500">
                  No Image
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <label className={`${buttonWhite} inline-flex cursor-pointer items-center gap-2`}>📷 画像を選択
                  <input
                    id="file_upload"
                    name="file_upload"
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
            </div>
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
                className={`w-1/2 ${inputBase} text-right ${form.is_someday ? "bg-gray-100 cursor-not-allowed" : ""}`}
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
            className={buttonWhite}
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={pending}
            className={`${buttonBlack} disabled:opacity-60`}
          >
            {pending ? "送信中..." : "登録"}
          </button>
        </div>
      </form>
    </div>
  );
}

