"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function AuthButtons() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined } });
  }

  async function signOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
  }

  if (signedIn === null) return null;

  return (
    <div className="text-sm">
      {signedIn ? (
        <button onClick={signOut} className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">サインアウト</button>
      ) : (
        <button onClick={signIn} className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">GitHubでサインイン</button>
      )}
    </div>
  );
}

