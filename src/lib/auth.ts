import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE_NAME = 'wishlist-auth';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7日間

export async function verifyPassword(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD is not set');
  }
  
  // 環境変数が既にハッシュ化されているかチェック（$2a$で始まる）
  if (adminPassword.startsWith('$2a$') || adminPassword.startsWith('$2b$')) {
    return await bcrypt.compare(password, adminPassword);
  }
  
  // プレーンテキストの場合は直接比較（開発用）
  return password === adminPassword;
}

export async function createSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return session?.value || null;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

