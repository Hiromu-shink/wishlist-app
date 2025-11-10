"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function HeaderNav() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month") ?? currentMonth();

  return (
    <header className="border-b">
      <div className="mx-auto max-w-3xl p-4 flex items-center justify-between">
        <Link href={`/?month=${month}`} className="font-semibold">
          Wishlist
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
