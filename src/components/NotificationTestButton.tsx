"use client";

type Props = {
  className?: string;
};

export function NotificationTestButton({ className }: Props) {
  const handleClick = async () => {
    if (!("Notification" in window)) {
      alert("このブラウザでは通知がサポートされていません");
      return;
    }
    if (Notification.permission !== "granted") {
      alert("通知を許可してからテストしてください");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification("テスト通知", {
        body: "通知設定が有効です",
      });
    } catch (err) {
      console.error(err);
      alert("テスト通知に失敗しました");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className ?? "rounded border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"}
    >
      テスト通知を送る
    </button>
  );
}

