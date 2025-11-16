import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseRSCClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

async function getSession() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function LoginPage() {
  const user = await getSession();
  if (user) redirect("/");
  return (
    <div className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-xl font-semibold">ログイン</h1>
      <form className="space-y-3" action="/api/auth/login" method="post">
        <input name="email" type="email" required placeholder="メールアドレス" className="w-full h-10 px-3 border rounded" />
        <input name="password" type="password" required placeholder="パスワード" className="w-full h-10 px-3 border rounded" />
        <button className="w-full h-10 px-4 py-2 border rounded bg-black text-white">ログイン</button>
      </form>
      <form action="/api/auth/oauth" method="post">
        <input type="hidden" name="provider" value="google" />
        <button className="w-full h-10 px-4 py-2 border rounded">Google でログイン</button>
      </form>
      <p className="text-sm text-gray-600">
        アカウントがない方は <Link className="underline" href="/signup">新規登録</Link>
      </p>
    </div>
  );
}

"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'ログインに失敗しました');
        return;
      }

      // ログイン成功後、トップページへリダイレクト
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-2xl font-semibold">パスワード認証</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            アプリにアクセスするにはパスワードが必要です
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-black focus:border-black"
              placeholder="パスワードを入力"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-60"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}

