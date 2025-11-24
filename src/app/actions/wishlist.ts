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
  is_someday: z.boolean().optional().default(false),
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

function ensureHttps(url?: string | null) {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.toLowerCase().startsWith("http://")) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }
  return trimmed;
}

export async function createWishlistItem(values: z.infer<typeof inputSchema>) {
  const supabase = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

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
  imageUrl = ensureHttps(imageUrl);

  const { data, error } = await supabase.from("wishlist").insert({
    user_id: user.id,
    name: parsed.name,
    price: normalizePrice(parsed.price ?? null),
    url: parsed.url ?? null,
    image_url: imageUrl,
    comment: parsed.comment ?? null,
    deadline: parsed.is_someday ? null : deadline,
    priority: parsed.priority,
    is_purchased: parsed.is_purchased ?? false,
    purchased_date: normalizeDate(parsed.purchased_date ?? null),
    month: parsed.is_someday ? "someday" : month,
    is_someday: parsed.is_someday ?? false,
  }).select("id, month, is_someday").single();
  if (error) throw error;
  revalidatePath("/");
  return data;
}

export async function deleteWishlistItem(id: string) {
  const supabase = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  // 完全削除ではなく、deletedフラグを設定
  const { error } = await supabase
    .from("wishlist")
    .update({ deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/trash");
}

export async function restoreWishlistItem(id: string) {
  const supabase = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { error } = await supabase
    .from("wishlist")
    .update({ deleted: false, deleted_at: null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/trash");
}

export async function permanentlyDeleteWishlistItem(id: string) {
  const supabase = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  // 完全削除
  const { error } = await supabase.from("wishlist").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/trash");
}

export async function togglePurchased(id: string, purchased: boolean, purchased_date?: string | null) {
  const supabase = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { error } = await supabase
    .from("wishlist")
    .update({ is_purchased: purchased, purchased_date: purchased ? (purchased_date ?? new Date().toISOString().slice(0, 10)) : null })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/");
}

export async function updateWishlistItem(id: string, values: Partial<z.infer<typeof inputSchema>>) {
  const supabase = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const payload: any = { ...values };
  if (Object.prototype.hasOwnProperty.call(payload, 'price')) {
    payload.price = normalizePrice(payload.price);
  }
  if (Object.prototype.hasOwnProperty.call(payload, "image_url")) {
    payload.image_url = ensureHttps(payload.image_url);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'deadline')) {
    payload.deadline = normalizeDate(payload.deadline);
    payload.month = calcMonth(payload.deadline ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'purchased_date')) {
    payload.purchased_date = normalizeDate(payload.purchased_date);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'is_someday')) {
    if (payload.is_someday) {
      payload.deadline = null;
      payload.month = "someday";
    } else if (payload.deadline) {
      payload.month = calcMonth(payload.deadline ?? null);
    }
  }
  const { error } = await supabase.from("wishlist").update(payload).eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/");
}

export async function getWishlistItemById(id: string) {
  const supabase = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data, error } = await supabase.from("wishlist").select("*").eq("id", id).eq("user_id", user.id).single();
  if (error) throw error;
  return data as any;
}

export async function getWishlistItems(month: string, sort: string = "created-desc") {
  const supabase = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  let query = supabase
    .from("wishlist")
    .select("*")
    .eq("month", month)
    .eq("user_id", user.id)
    .or("deleted.is.null,deleted.eq.false");
  if (sort === "created-desc" || sort === "created") {
    query = query.order("created_at", { ascending: false });
  }
  const { data, error } = await query;
  if (error) throw error;
  const items = (data as any[]) ?? [];
  
  const sorted = (() => {
    const arr = [...items];
    const toTime = (value?: string | null) => {
      if (!value) return null;
      const t = new Date(value).getTime();
      return Number.isFinite(t) ? t : null;
    };
    switch (sort) {
      case "priority-desc":
        return arr.sort((a, b) => b.priority - a.priority);
      case "priority-asc":
        return arr.sort((a, b) => a.priority - b.priority);
      case "price-desc":
        return arr.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
      case "price-asc":
        return arr.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
      case "deadline-asc":
        return arr.sort((a, b) => {
          const ta = toTime(a.deadline);
          const tb = toTime(b.deadline);
          if (ta === null && tb === null) return 0;
          if (ta === null) return 1;
          if (tb === null) return -1;
          return ta - tb;
        });
      case "deadline-desc":
        return arr.sort((a, b) => {
          const ta = toTime(a.deadline);
          const tb = toTime(b.deadline);
          if (ta === null && tb === null) return 0;
          if (ta === null) return 1;
          if (tb === null) return -1;
          return tb - ta;
        });
      case "created-desc":
      case "created":
        return arr.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
      default:
        return arr.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
    }
  })();
  
  return sorted;
}

export async function getSomedayItems() {
  const supabase = await (await import("@/lib/supabase/server")).createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data, error } = await supabase
    .from("wishlist")
    .select("*")
    .eq("month", "someday")
    .eq("user_id", user.id)
    .or("deleted.is.null,deleted.eq.false")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as any[]) ?? [];
}

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function extractMeta(html: string, key: string) {
  const metaRegex = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, "i");
  const match = html.match(metaRegex);
  return match?.[1]?.trim() ?? null;
}

function extractTitle(html: string) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  if (match?.[1]) {
    return match[1].trim();
  }
  return null;
}

function extractPrice(html: string) {
  const priceMetaKeys = [
    "product:price:amount",
    "og:price:amount",
    "twitter:data1",
    "og:price",
  ];
  for (const key of priceMetaKeys) {
    const value = extractMeta(html, key);
    if (value) {
      const numeric = Number(value.replace(/[^0-9.,]/g, "").replace(/,/g, ""));
      if (Number.isFinite(numeric)) return numeric;
    }
  }

  const currencyRegex = /(¥|￥)\s*([0-9]{1,3}(?:,[0-9]{3})*)/;
  const match = html.match(currencyRegex);
  if (match?.[2]) {
    const numeric = Number(match[2].replace(/,/g, ""));
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
}

const metadataInputSchema = z.object({
  url: z.string().url(),
});

export async function fetchUrlMetadata(values: z.infer<typeof metadataInputSchema>) {
  const { url } = metadataInputSchema.parse(values);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`ステータスコード: ${response.status}`);
    }

    const html = await response.text();
    const image = extractMeta(html, "og:image") || extractMeta(html, "twitter:image") || null;
    const title = extractMeta(html, "og:title") || extractTitle(html);
    const price = extractPrice(html);

    return {
      ok: true as const,
      data: {
        title: title ?? null,
        price,
        imageUrl: image,
      },
    };
  } catch (error: any) {
    return {
      ok: false as const,
      error: error?.message ?? "メタデータ取得に失敗しました",
    };
  }
}

