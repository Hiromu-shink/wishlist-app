import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const month = url.searchParams.get("month") || "";
	const sort = url.searchParams.get("sort") || "created-desc";

	try {
		const supabase = await createSupabaseServerClient();
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ items: [] }, { status: 401 });
		}

		let query = supabase.from("wishlist").select("*").eq("user_id", user.id);
		if (month) query = query.eq("month", month);

		// 並び替え（サーバー側で可能な範囲）
		switch (sort) {
			case "created-desc":
			case "created":
				query = query.order("created_at", { ascending: false });
				break;
			case "priority-desc":
				query = query.order("priority", { ascending: false });
				break;
			case "priority-asc":
				query = query.order("priority", { ascending: true });
				break;
			case "price-desc":
				query = query.order("price", { ascending: false, nullsFirst: true as any });
				break;
			case "price-asc":
				query = query.order("price", { ascending: true, nullsFirst: true as any });
				break;
			default:
				query = query.order("created_at", { ascending: false });
		}

		const { data, error } = await query;
		if (error) throw error;
		return NextResponse.json({ items: data ?? [] });
	} catch (e: any) {
		return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 });
	}
}


