-- 削除済み機能のためのカラムを追加
ALTER TABLE public.wishlist 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- インデックスを追加（削除済みアイテムの検索を高速化）
CREATE INDEX IF NOT EXISTS idx_wishlist_deleted ON public.wishlist(deleted, deleted_at);

-- 既存のデータは deleted = false に設定
UPDATE public.wishlist SET deleted = FALSE WHERE deleted IS NULL;

