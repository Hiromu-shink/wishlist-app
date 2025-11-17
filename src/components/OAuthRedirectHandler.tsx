"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OAuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    // OAuthコールバック後に保存されたリダイレクト先を取得
    const redirectTo = sessionStorage.getItem("oauth_redirect_to");
    if (redirectTo) {
      sessionStorage.removeItem("oauth_redirect_to");
      router.push(redirectTo);
    }
  }, [router]);

  return null;
}

