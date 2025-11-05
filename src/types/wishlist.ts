export type WishlistItem = {
  id: string;
  user_id: string;
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
};

