"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Plus, Search, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";

const iconButton = "p-2 text-gray-700 hover:text-blue-600 focus:outline-none";
const menuItem = "block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset";

export function HeaderNav() {
  const pathname = usePathname();
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

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="text-2xl font-bold hover:text-blue-600">
          Wishlist
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/new" className={iconButton} aria-label="新規登録">
            <Plus size={20} />
          </Link>
          <Link href="/search" className={iconButton} aria-label="検索">
            <Search size={20} />
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
              <User size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border bg-white shadow-lg focus:outline-none" role="menu">
                <Link
                  href="/someday"
                  className={menuItem}
                  onClick={() => setMenuOpen(false)}
                >
                  保存済み（Saved）
                </Link>
                <Link
                  href="/purchased"
                  className={menuItem}
                  onClick={() => setMenuOpen(false)}
                >
                  購入済み
                </Link>
                <Link
                  href="/trash"
                  className={menuItem}
                  onClick={() => setMenuOpen(false)}
                >
                  削除済み
                </Link>
                <Link
                  href="/stats"
                  className={menuItem}
                  onClick={() => setMenuOpen(false)}
                >
                  統計
                </Link>
                <Link
                  href="/account"
                  className={menuItem}
                  onClick={() => setMenuOpen(false)}
                >
                  アカウント
                </Link>
                <LogoutButton
                  variant="menu"
                  className="border-t text-left"
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
