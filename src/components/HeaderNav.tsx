"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export function HeaderNav() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-3xl p-4 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          Wishlist
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
