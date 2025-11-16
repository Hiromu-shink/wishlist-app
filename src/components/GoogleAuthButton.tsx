"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";

export function GoogleAuthButton({ label = "Google でログイン" }: { label?: string }) {
  async function handleClick() {
    const supabase = getSupabaseBrowser();
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: origin,
        queryParams: { prompt: "select_account" },
      },
    });
  }
  return (
    <button onClick={handleClick} className="w-full h-10 px-4 py-2 border rounded">
      {label}
    </button>
  );
}


