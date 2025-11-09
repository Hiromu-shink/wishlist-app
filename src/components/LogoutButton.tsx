"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const buttonWhite = "h-10 px-4 py-2 border rounded text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={buttonWhite}
    >
      {loading ? 'ログアウト中...' : 'ログアウト'}
    </button>
  );
}

