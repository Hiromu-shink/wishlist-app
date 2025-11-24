import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const month = url.searchParams.get("month") || "";
	const sort = url.searchParams.get("sort") || "created-desc";

	try {
		const supabase = await createSupabaseServerClient();
		const { data: { user }, error: userError } = await supabase.auth.getUser();
		
		console.log('[API Wishlist] Getting user...');
		if (userError) {
			console.error('[API Wishlist] Error getting user:', userError.message);
		}
		
		if (!user) {
			console.log('[API Wishlist] No user found, returning 401');
			return NextResponse.json({ items: [] }, { status: 401 });
		}

		console.log('[API Wishlist] User:', user.email);
		console.log('[API Wishlist] User ID:', user.id);
		console.log('[API Wishlist] month param:', month);
		console.log('[API Wishlist] Sort:', sort);

		let query = supabase
			.from("wishlist")
			.select("*")
			.eq("user_id", user.id)
			.or("deleted.is.null,deleted.eq.false");
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
		if (error) {
			console.error('[API Wishlist] Query error:', error);
			throw error;
		}
		console.log('[API Wishlist] Returning items count:', data?.length ?? 0);
		if (data && data.length > 0) {
			console.log('[API Wishlist] First item user_id:', data[0].user_id);
		}
		return NextResponse.json({ items: data ?? [] });
	} catch (e: any) {
		return NextResponse.json({ error: e?.message ?? "failed" }, { status: 500 });
	}
}


