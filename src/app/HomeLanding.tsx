"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const buttonBase = "h-10 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black";
const buttonBlack = `${buttonBase} bg-black text-white hover:bg-gray-800`;
const buttonWhite = `${buttonBase} bg-white hover:bg-gray-50`;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function HomeLanding() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  const monthOptions = useMemo(() => {
    const startYear = 2025;
    const years = 5;
    const list: string[] = [];
    for (let year = startYear; year < startYear + years; year += 1) {
      for (let m = 1; m <= 12; m += 1) {
        list.push(`${year}-${String(m).padStart(2, "0")}`);
      }
    }
    return list;
  }, []);

  const navigateToMonth = (month: string) => {
    router.push(`/month?month=${month}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Wishlist ホーム</h1>
        <p className="text-sm text-gray-600">
          見たい月を選んで、欲しいものリストを確認しましょう。
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">月を選択</h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            min={monthOptions[0]}
            max={monthOptions[monthOptions.length - 1]}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={`${buttonWhite} w-[170px]`}
          />
          <button
            onClick={() => navigateToMonth(selectedMonth)}
            className={buttonBlack}
          >
            この月を見る
          </button>
          <button
            onClick={() => navigateToMonth(currentMonth())}
            className={buttonWhite}
          >
            今月を見る
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">ショートカット</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {monthOptions.slice(0, 8).map((month) => (
            <button
              key={month}
              onClick={() => navigateToMonth(month)}
              className={buttonWhite}
            >
              {month}
            </button>
          ))}
        </div>
        <div>
          <button
            onClick={() => router.push("/month?month=someday")}
            className={buttonWhite}
          >
            いつか欲しいリストを見る
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">新規登録</h2>
        <p className="text-sm text-gray-600">欲しいものを追加する場合はこちらから。</p>
        <button onClick={() => router.push("/new")} className={buttonBlack}>
          欲しいものを登録する
        </button>
      </section>
    </div>
  );
}
