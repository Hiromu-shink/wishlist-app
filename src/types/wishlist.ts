export type WishlistItem = {
  id: string;
  user_id: string | null;
  name: string;
  price: number | null;
  url: string | null;
  image_url: string | null;
  comment: string | null;
  deadline: string | null; // ISO date string
  priority: number; // 1-5
  is_purchased: boolean;
  purchased_date: string | null; // ISO date string
  month: string; // e.g. "2024-11"
  created_at: string; // ISO timestamp
  is_someday: boolean; // 未定（いつか欲しい）
  deleted?: boolean; // 削除フラグ
  deleted_at?: string | null; // ISO timestamp
};

