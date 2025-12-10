"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateNotificationPreferences(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const notifyDeadline = formData.get("notify_deadline") === "on";
  const notifyBudget = formData.get("notify_budget") === "on";

  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: user.id,
    notify_deadline: notifyDeadline,
    notify_budget: notifyBudget,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  revalidatePath("/account");
}

