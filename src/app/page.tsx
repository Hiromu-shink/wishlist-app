import { Suspense } from "react";
import { HomeClient } from "./HomeClient";

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl p-6"><p className="text-sm text-gray-500">読み込み中...</p></div>}>
      <HomeClient />
    </Suspense>
  );
}
