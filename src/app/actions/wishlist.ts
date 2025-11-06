"use server";

import { z } from "zod";
import { createSupabaseServerAnon } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const inputSchema = z.object({
  name: z.string().min(1),
  price: z.number().nullable().optional(),
  url: z.string().url().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  comment: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(), // ISO date (YYYY-MM-DD)
  priority: z.number().min(1).max(5),
  is_purchased: z.boolean().optional().default(false),
  purchased_date: z.string().nullable().optional(), // ISO date
});

function calcMonth(isoDate?: string | null) {
  const d = isoDate ? new Date(isoDate) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function normalizeDate(value?: string | null) {
  if (!value) return null;
  // value が既に YYYY-MM-DD ならそのまま、ISO なら先頭10文字を使う
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizePrice(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'string' ? Number(value.trim()) : Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function createWishlistItem(values: z.infer<typeof inputSchema>) {
  const supabase = createSupabaseServerAnon();

  const parsed = inputSchema.parse(values);
  const deadline = normalizeDate(parsed.deadline ?? null);
  const month = calcMonth(deadline);

  // 画像URL未指定かつ商品URLがある場合、OG画像を試行取得
  let imageUrl = parsed.image_url ?? null;
  if (!imageUrl && parsed.url) {
    try {
      const res = await fetch(parsed.url, { cache: "no-store" });
      const html = await res.text();
      const meta = (name: string) => {
        const re = new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, "i");
        const m = html.match(re);
        return m?.[1];
      };
      imageUrl = meta("og:image") || meta("twitter:image") || null;
    } catch (_) {
      // 失敗しても無視
    }
  }

  const { error } = await supabase.from("wishlist").insert({
    user_id: null,
    name: parsed.name,
    price: normalizePrice(parsed.price ?? null),
    url: parsed.url ?? null,
    image_url: imageUrl,
    comment: parsed.comment ?? null,
    deadline,
    priority: parsed.priority,
    is_purchased: parsed.is_purchased ?? false,
    purchased_date: normalizeDate(parsed.purchased_date ?? null),
    month,
  });
  if (error) throw error;
  revalidatePath("/");
}

export async function deleteWishlistItem(id: string) {
  const supabase = createSupabaseServerAnon();
  const { error } = await supabase.from("wishlist").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/");
}

export async function togglePurchased(id: string, purchased: boolean, purchased_date?: string | null) {
  const supabase = createSupabaseServerAnon();
  const { error } = await supabase
    .from("wishlist")
    .update({ is_purchased: purchased, purchased_date: purchased ? (purchased_date ?? new Date().toISOString().slice(0, 10)) : null })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/");
}

export async function updateWishlistItem(id: string, values: Partial<z.infer<typeof inputSchema>>) {
  const supabase = createSupabaseServerAnon();
  const payload: any = { ...values };
  if (Object.prototype.hasOwnProperty.call(payload, 'price')) {
    payload.price = normalizePrice(payload.price);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'deadline')) {
    payload.deadline = normalizeDate(payload.deadline);
    payload.month = calcMonth(payload.deadline ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'purchased_date')) {
    payload.purchased_date = normalizeDate(payload.purchased_date);
  }
  const { error } = await supabase.from("wishlist").update(payload).eq("id", id);
  if (error) throw error;
  revalidatePath("/");
}

export async function getWishlistItems(month: string, sort: string = "created") {
  const supabase = createSupabaseServerAnon();
  let query = supabase.from("wishlist").select("*").eq("month", month);
  if (sort === "created") {
    query = query.order("created_at", { ascending: false });
  }
  const { data, error } = await query;
  if (error) throw error;
  const items = (data as any[]) ?? [];
  
  const sorted = (() => {
    const arr = [...items];
    switch (sort) {
      case "priority-desc":
        return arr.sort((a, b) => b.priority - a.priority);
      case "priority-asc":
        return arr.sort((a, b) => a.priority - b.priority);
      case "price-desc":
        return arr.sort((a, b) => (Number(b.price ?? 0)) - (Number(a.price ?? 0)));
      case "price-asc":
        return arr.sort((a, b) => (Number(a.price ?? 0)) - (Number(b.price ?? 0)));
      case "deadline-asc":
        return arr.sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''));
      case "deadline-desc":
        return arr.sort((a, b) => (b.deadline ?? '').localeCompare(a.deadline ?? ''));
      case "created":
      default:
        return arr;
    }
  })();
  
  return sorted;
}

