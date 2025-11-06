"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
      className="px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-60"
    >
      {loading ? 'ログアウト中...' : 'ログアウト'}
    </button>
  );
}

