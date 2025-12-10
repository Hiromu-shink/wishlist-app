import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Supabase env is missing");
}

webpush.setVapidDetails(
  "mailto:notifications@example.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
);

type PushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

async function sendPush(subscription: PushSubscription, payload: Record<string, unknown>) {
  try {
    await webpush.sendNotification(subscription as any, JSON.stringify(payload));
  } catch (error) {
    console.error("Push send failed", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const today = new Date();
  const startIso = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);
  const endIso = threeDaysLater.toISOString();

  // 期限通知対象
  const { data: dueItems, error: dueError } = await supabase
    .from("wishlist")
    .select("id, name, deadline, user_id")
    .gte("deadline", startIso)
    .lte("deadline", endIso)
    .eq("is_purchased", false)
    .or("deleted.is.null,deleted.eq.false");

  if (dueError) {
    console.error(dueError);
    return new Response(JSON.stringify({ error: dueError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ユーザーの通知設定
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("user_id, notify_deadline, notify_budget");

  const prefByUser = new Map<string, { notify_deadline: boolean; notify_budget: boolean }>();
  prefs?.forEach((p) => prefByUser.set(p.user_id, p));

  // プッシュ購読
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, auth, p256dh");

  const subsByUser = new Map<string, PushSubscription[]>();
  subscriptions?.forEach((sub) => {
    const list = subsByUser.get(sub.user_id) ?? [];
    list.push({
      endpoint: sub.endpoint,
      keys: { auth: sub.auth, p256dh: sub.p256dh },
    });
    subsByUser.set(sub.user_id, list);
  });

  // 期限通知を送信
  if (dueItems) {
    for (const item of dueItems) {
      const pref = prefByUser.get(item.user_id);
      if (pref && !pref.notify_deadline) continue;
      const subs = subsByUser.get(item.user_id);
      if (!subs?.length || !item.deadline) continue;
      const deadlineDate = new Date(item.deadline);
      const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const payload = {
        title: "期限が近づいています",
        body: `${item.name} の期限が${daysLeft}日後です`,
        data: { itemId: item.id },
      };
      await Promise.all(subs.map((s) => sendPush(s, payload)));
    }
  }

  // 予算通知: 現在の月
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const { data: budgets } = await supabase
    .from("budget_limits")
    .select("user_id, amount")
    .eq("month", currentMonth);

  const { data: spendingRows } = await supabase
    .from("wishlist")
    .select("user_id, price, is_purchased, month")
    .eq("month", currentMonth)
    .or("deleted.is.null,deleted.eq.false");

  const spendingByUser = new Map<string, number>();
  spendingRows?.forEach((row) => {
    const price = Number(row.price ?? 0);
    if (!Number.isFinite(price)) return;
    const total = spendingByUser.get(row.user_id) ?? 0;
    spendingByUser.set(row.user_id, total + price);
  });

  for (const budget of budgets ?? []) {
    const pref = prefByUser.get(budget.user_id);
    if (pref && !pref.notify_budget) continue;
    const subs = subsByUser.get(budget.user_id);
    if (!subs?.length) continue;
    const spending = spendingByUser.get(budget.user_id) ?? 0;
    const ratio = spending / Number(budget.amount);
    const isMonday = today.getDay() === 1;
    const messages: { title: string; body: string }[] = [];
    if (isMonday) {
      messages.push({
        title: "今週の予算状況",
        body: `今月の合計: ${Math.round(spending)} / ${Math.round(Number(budget.amount))}`,
      });
    }
    if (ratio >= 1) {
      messages.push({
        title: "予算を超えています",
        body: `今月の合計が予算を超過しました`,
      });
    } else if (ratio >= 0.5) {
      messages.push({
        title: "予算の50%に到達",
        body: `今月の合計が予算の50%を超えました`,
      });
    }
    for (const msg of messages) {
      await Promise.all(
        subs.map((s) =>
          sendPush(s, {
            title: msg.title,
            body: msg.body,
            data: { month: currentMonth },
          }),
        ),
      );
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

