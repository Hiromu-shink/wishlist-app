export const dynamic = "force-dynamic";

import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";

export default async function PurchasedPage() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  return (
    <div className="container mx-auto p-4">
      <Breadcrumb items={[
        { label: 'ホーム', href: '/' },
        { label: '購入済みリスト' }
      ]} />
      <h1 className="text-2xl font-bold mb-4">購入済みリスト</h1>
      <p className="text-gray-600 mb-8">購入済みのアイテムを一覧表示します</p>
      <div className="text-center text-gray-400">準備中...</div>
    </div>
  );
}
