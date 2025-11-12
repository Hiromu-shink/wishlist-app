"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";

const buttonBase = "h-10 px-4 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-black";
const iconButton = `${buttonBase} bg-white hover:bg-gray-50 flex items-center justify-center w-10 filter grayscale`;

const HOME_ICON = "🏠\uFE0E";
const PLUS_ICON = "➕\uFE0E";
const SEARCH_ICON = "🔍\uFE0E";
const ACCOUNT_ICON = "👤\uFE0E";

export function HeaderNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/" className="font-semibold text-lg">
          Wishlist
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/" className={iconButton} aria-label="ホーム">
            {HOME_ICON}
          </Link>
          <Link href="/new" className={iconButton} aria-label="新規登録">
            {PLUS_ICON}
          </Link>
          <Link href="/search" className={iconButton} aria-label="検索">
            {SEARCH_ICON}
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className={iconButton}
              aria-label="アカウント"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {ACCOUNT_ICON}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-lg border bg-white shadow-lg focus:outline-none" role="menu">
                <LogoutButton
                  variant="menu"
                  className="rounded-lg"
                  onComplete={() => setMenuOpen(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
