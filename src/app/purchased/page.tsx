export const dynamic = "force-dynamic";

import { createSupabaseRSCClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";

export default async function PurchasedPage() {
  const supabase = await createSupabaseRSCClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: '購入済み' }
      ]} />
      <h1 className="text-2xl font-bold mb-2">購入済み</h1>
      <p className="text-gray-600 mb-4">Total: 0</p>
      <div className="text-center text-gray-400">準備中...</div>
    </div>
  );
}
