export const dynamic = 'force-dynamic';
import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { WishlistCard } from "@/components/WishlistCard";
import type { WishlistItem } from "@/types/wishlist";
import { SortSelector } from "@/components/SortSelector";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getAroundMonths(): string[] {
  const now = new Date();
  return [-2, -1, 0, 1, 2].map((d) => {
    const dt = new Date(now.getFullYear(), now.getMonth() + d, 1);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
  });
}

type Props = { searchParams: { month?: string; sort?: string } };

export default async function Home({ searchParams }: Props) {
  const month = searchParams.month || currentMonth();
  const sort = searchParams.sort || "created";

  const supabase = createSupabaseRSCClient();
  let items: WishlistItem[] = [];
  {
    let query = supabase.from("wishlist").select("*").eq("month", month);
    if (sort === "created") {
      query = query.order("created_at", { ascending: false });
    }
    const { data } = await query;
    items = (data as any as WishlistItem[]) ?? [];
  }

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
        return arr; // 必要に応じ created_at で並べ替え
    }
  })();

  const total = sorted.filter((i) => !i.is_purchased).reduce((sum, i) => sum + Number(i.price ?? 0), 0);

  const months = getAroundMonths();

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {months.map((m) => (
            <a key={m} href={`/?month=${m}&sort=${sort}`} className={`px-3 py-1 rounded border text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${m === month ? "bg-black text-white" : "bg-white"}`}>{m}</a>
          ))}
        </div>
        <SortSelector month={month} sort={sort} />
      </header>
      <div className="flex items-center justify-between text-sm text-gray-700">
        <div>月合計(購入済み除外): <span className="font-semibold">{total.toLocaleString()}円</span></div>
        <a href="/new" className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">新規登録</a>
      </div>
      <section className="grid grid-cols-1 gap-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500">この月のアイテムはありません。</p>
        ) : (
          sorted.map((item) => <WishlistCard key={item.id} item={item} />)
        )}
      </section>
    </div>
  );
}
