"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";

export function GoogleAuthButton({ label = "Google でログイン" }: { label?: string }) {
  async function handleClick() {
    const supabase = getSupabaseBrowser();
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    if (!origin) return;
    
    // 現在のパスを保存（コールバック後に戻るため）
    const currentPath = typeof window !== "undefined" ? (window.location.pathname + window.location.search) : "/";
    if (currentPath !== "/login" && currentPath !== "/signup") {
      sessionStorage.setItem("oauth_redirect_to", currentPath);
    }
    
    // SupabaseのコールバックURL（絶対URLのみ）
    const callbackUrl = `${origin}/auth/callback`;
    
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        // queryParamsは最小限に（Supabaseが管理）
      },
    });
  }
  return (
    <button onClick={handleClick} className="w-full h-10 px-4 py-2 border rounded">
      {label}
    </button>
  );
}


