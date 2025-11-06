"use client";

import { useState, useTransition } from "react";
import { z } from "zod";
import { createWishlistItem } from "@/app/actions/wishlist";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const schema = z.object({
  name: z.string().min(1, "必須です"),
  price: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  image_url: z.string().url().optional().or(z.literal("")),
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
    image_url: "",
    comment: "",
    deadline: "",
    priority: 3,
    is_purchased: false,
    purchased_date: "",
    is_someday: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);

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
          image_url: uploadedUrl || (form.image_url || null),
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
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="name" className="block text-sm mb-1">登録名 *</label>
          <input id="name" name="name" className="w-full border rounded px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm mb-1">価格</label>
            <input id="price" name="price" type="number" className="w-full border rounded px-3 py-2" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm mb-1">優先度</label>
            <input id="priority" name="priority" type="range" min={1} max={5} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label htmlFor="url" className="block text-sm mb-1">URL</label>
          <input id="url" name="url" className="w-full border rounded px-3 py-2" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </div>
        <div>
          <label htmlFor="image_url" className="block text-sm mb-1">画像URL（未設定なら自動取得予定）</label>
          <input id="image_url" name="image_url" className="w-full border rounded px-3 py-2" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        </div>
        <div>
          <label htmlFor="file_upload" className="block text-sm mb-1">画像アップロード（ストレージ）</label>
          <input id="file_upload" name="file_upload" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div>
          <label htmlFor="comment" className="block text-sm mb-1">コメント</label>
          <textarea id="comment" name="comment" className="w-full border rounded px-3 py-2" rows={4} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="deadline" className={`block text-sm mb-1 ${form.is_someday ? "text-gray-400" : ""}`}>期限</label>
            <input 
              id="deadline"
              name="deadline"
              type="date" 
              className={`w-full border rounded px-3 py-2 ${form.is_someday ? "bg-gray-100 cursor-not-allowed" : ""}`}
              value={form.deadline} 
              onChange={(e) => setForm({ ...form, deadline: e.target.value })} 
              disabled={form.is_someday}
            />
          </div>
          <div className="flex items-end gap-2">
            <label htmlFor="is_someday" className="inline-flex items-center gap-2">
              <input id="is_someday" name="is_someday" type="checkbox" checked={form.is_someday} onChange={(e) => setForm({ ...form, is_someday: e.target.checked, deadline: e.target.checked ? "" : form.deadline })} />
              未定
            </label>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="px-4 py-2 border rounded disabled:opacity-60">{pending ? "送信中..." : "登録"}</button>
        </div>
      </form>
    </div>
  );
}

