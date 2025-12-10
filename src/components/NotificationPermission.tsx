"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type PermissionState = NotificationPermission | "unsupported" | "error";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function saveSubscription(subscription: PushSubscription) {
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription }),
  });
}

export function NotificationPermission() {
  const pathname = usePathname();
  const [permission, setPermission] = useState<PermissionState>("default");
  const [status, setStatus] = useState<string | null>(null);

  // ログイン前ページでは非表示
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const vapidPublicKey = useMemo(() => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const ensureServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker が未サポートです");
    }
    const registration = await navigator.serviceWorker.register("/push-sw.js");
    await navigator.serviceWorker.ready;
    return registration;
  };

  const subscribePush = async () => {
    if (!vapidPublicKey) {
      throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY が設定されていません");
    }
    const registration = await ensureServiceWorker();
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await saveSubscription(existing);
      return "既存の購読を再利用しました";
    }
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    await saveSubscription(subscription);
    return "購読を保存しました";
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setStatus(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        const message = await subscribePush();
        setStatus(message);
      }
    } catch (err) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : "通知の設定に失敗しました");
      setPermission("error");
    }
  };

  const sendTest = async () => {
    try {
      const registration = await ensureServiceWorker();
      registration.showNotification("テスト通知", {
        body: "通知設定が有効です",
      });
    } catch (err) {
      console.error(err);
      setStatus(err instanceof Error ? err.message : "テスト通知に失敗しました");
    }
  };

  if (permission === "granted") {
    return null;
  }

  if (permission === "unsupported") {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-3">
        <div className="rounded-lg bg-gray-100 p-4 text-sm text-gray-700">
          このブラウザでは通知がサポートされていません。
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-3">
      <div className="rounded-lg bg-blue-50 p-4 shadow-sm">
        <p className="text-sm text-gray-700 mb-3">
          期限が近づいたり予算が超過した際に通知を送ります。通知を許可してください。
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={requestPermission}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            通知を許可する
          </button>
          <button
            type="button"
            onClick={sendTest}
            className="rounded border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            テスト通知
          </button>
        </div>
        {status && <p className="mt-2 text-xs text-gray-600">{status}</p>}
      </div>
    </div>
  );
}

