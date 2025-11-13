import Link from "next/link";
import type { ReactNode } from "react";
import { createSupabaseServerAnon } from "@/lib/supabase/server";
import type { WishlistItem } from "@/types/wishlist";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ja-JP");
}

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

function pickCurrentHighlight(items: WishlistItem[]): WishlistItem | null {
  if (!items.length) return null;
  const now = new Date();
  const soon = items
    .filter((item) => item.deadline)
    .filter((item) => {
      const date = new Date(item.deadline as string);
      if (Number.isNaN(date.getTime())) return false;
      const diff = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    });
  if (soon.length) return pickRandom(soon);

  const highPriority = items.filter((item) => item.priority >= 4);
  if (highPriority.length) return pickRandom(highPriority);

  return pickRandom(items);
}

function Card({ title, description, footer, href, imageUrl, hideContent = false, ariaDescription }: { title: string; description: ReactNode; footer?: ReactNode; href: string; imageUrl?: string | null; hideContent?: boolean; ariaDescription?: string }) {
  const label = ariaDescription ? `${title}: ${ariaDescription}` : title;
  return (
    <Link
      href={href}
      aria-label={label}
      className="group aspect-square overflow-hidden rounded-xl border border-[#dddddd] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex h-full flex-col p-4">
        <h3 className="text-lg font-semibold text-[#333]">{title}</h3>
        <div className="mt-3 aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#f0f0f0]">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="h-full w-full object-cover object-center transition duration-200 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-[#999]">No Image</div>
          )}
        </div>
        {!hideContent && (
          <>
            <div className="mt-3 flex-1 overflow-hidden text-sm text-[#555] space-y-1">
              {description}
            </div>
            {footer && <div className="mt-3 text-xs text-[#777]">{footer}</div>}
          </>
        )}
      </div>
    </Link>
  );
}

export async function HomeLanding() {
  const month = currentMonth();
  const supabase = createSupabaseServerAnon();

  const [{ data: currentItems }, { data: somedayItems }, { data: purchasedItems }, { data: allItems }] = await Promise.all([
    supabase.from("wishlist").select("*").eq("month", month),
    supabase.from("wishlist").select("*").eq("month", "someday"),
    supabase.from("wishlist").select("*").eq("is_purchased", true).neq("month", "someday"),
    supabase.from("wishlist").select("price, is_purchased, month"),
  ]);

  const highlightCurrent = pickCurrentHighlight((currentItems as WishlistItem[]) ?? []);
  const highlightSomeday = pickRandom((somedayItems as WishlistItem[]) ?? []);
  const highlightPurchased = pickRandom((purchasedItems as WishlistItem[]) ?? []);

  const totalPrice = ((allItems as WishlistItem[]) ?? []).reduce((sum, item) => sum + Number(item.price ?? 0), 0);
  const totalCount = (allItems ?? []).length;
  const currentBudget = "未設定";
  const currentRemaining = "-";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">ホーム</h1>
        <p className="text-sm text-gray-600">見たいリストを選んでください。</p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          href={`/month?month=${month}`}
          title="今月の欲しいもの"
          imageUrl={highlightCurrent?.image_url ?? null}
          hideContent
          ariaDescription={
            highlightCurrent
              ? `${highlightCurrent.name ?? ""} ${highlightCurrent.price ? `価格 ¥${Number(highlightCurrent.price).toLocaleString()}` : ""}`.trim()
              : "今月のアイテムがありません"
          }
          description={
            highlightCurrent ? (
              <>
                <p className="font-medium text-[#222] line-clamp-2">{highlightCurrent.name}</p>
                <p>価格: {highlightCurrent.price ? `¥${Number(highlightCurrent.price).toLocaleString()}` : "-"}</p>
                <p>
                  {highlightCurrent.deadline
                    ? `期限: ${formatDate(highlightCurrent.deadline)}`
                    : highlightCurrent.is_someday
                    ? "期限: 未定"
                    : "期限: -"}
                </p>
              </>
            ) : (
              <p>今月のアイテムがありません。新規登録してみましょう。</p>
            )
          }
        />

        <Card
          href="/month?month=someday"
          title="いつか欲しいもの"
          imageUrl={highlightSomeday?.image_url ?? null}
          hideContent
          ariaDescription={
            highlightSomeday
              ? `${highlightSomeday.name ?? ""} ${highlightSomeday.price ? `価格 ¥${Number(highlightSomeday.price).toLocaleString()}` : ""}`.trim()
              : "いつか欲しいリストは空です"
          }
          description={
            highlightSomeday ? (
              <>
                <p className="font-medium text-[#222] line-clamp-2">{highlightSomeday.name}</p>
                <p>優先度: {"★".repeat(highlightSomeday.priority)}</p>
                <p>価格: {highlightSomeday.price ? `¥${Number(highlightSomeday.price).toLocaleString()}` : "-"}</p>
              </>
            ) : (
              <p>いつか欲しいリストは空です。</p>
            )
          }
        />

        <Card
          href="/purchased"
          title="購入済みリスト"
          imageUrl={highlightPurchased?.image_url ?? null}
          hideContent
          ariaDescription={
            highlightPurchased
              ? `${highlightPurchased.name ?? ""} ${highlightPurchased.price ? `価格 ¥${Number(highlightPurchased.price).toLocaleString()}` : ""}`.trim()
              : "まだ購入済みアイテムがありません"
          }
          description={
            highlightPurchased ? (
              <>
                <p className="font-medium text-[#222] line-clamp-2">{highlightPurchased.name}</p>
                <p>購入日: {formatDate(highlightPurchased.purchased_date) ?? "-"}</p>
                <p>価格: {highlightPurchased.price ? `¥${Number(highlightPurchased.price).toLocaleString()}` : "-"}</p>
              </>
            ) : (
              <p>まだ購入済みアイテムがありません。</p>
            )
          }
        />

        <Card
          href="/stats"
          title="統計・ダッシュボード"
          imageUrl={null}
          ariaDescription={`全体の合計金額 ¥${totalPrice.toLocaleString()}、全体のアイテム数 ${totalCount}`}
          description={
            <>
              <p>全体の合計金額: ¥{totalPrice.toLocaleString()}</p>
              <p>全体のアイテム数: {totalCount}</p>
              <p>今月の予算: {currentBudget}</p>
              <p>残り: {currentRemaining}</p>
            </>
          }
          footer={<p>※ 統計ページは今後追加予定です。</p>}
        />
      </section>
    </div>
  );
}
