import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSbClient } from '@supabase/supabase-js';

function assertEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return { supabaseUrl, supabaseAnonKey } as const;
}

// RSC/ページ用（読み取りのみ・書き込みはNO-OP）
export async function createSupabaseRSCClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = assertEnv();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        try {
          return cookieStore.get(name)?.value;
        } catch {
          return undefined;
        }
      },
      set() {},
      remove() {},
    },
  });
}

// サーバーアクション/Route Handler用（書き込み可能）
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = assertEnv();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options });
      },
    },
  });
}

// Server-side (actions) anonymous client without cookie handling
export function createSupabaseServerAnon() {
  const { supabaseUrl, supabaseAnonKey } = assertEnv();
  return createSbClient(supabaseUrl, supabaseAnonKey);
}

