"use client";

import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase/client';

const buttonWhite = "h-10 px-4 py-2 border rounded text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60";
const menuButton = "w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60";

type LogoutButtonProps = {
  className?: string;
  variant?: 'default' | 'menu';
  onComplete?: () => void;
};

export function LogoutButton({ className, variant = 'default', onComplete }: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowser();
      
      // セッションストレージをクリア（OAuthリダイレクト情報など）
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
      
      // ログアウト処理
      await supabase.auth.signOut();
      
      // コールバックがあれば実行
      onComplete?.();
      
      // 完全にページをリロードしてログインページに遷移
      // これによりサーバー側とクライアント側の状態が完全にリセットされる
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // エラーが発生してもログインページに遷移
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    // finallyは不要（ページがリロードされるため）
  }

  const baseClass = variant === 'menu' ? menuButton : buttonWhite;

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={className ? `${baseClass} ${className}` : baseClass}
    >
      {loading ? 'ログアウト中...' : 'ログアウト'}
    </button>
  );
}

