-- is_somedayカラムの確認と追加SQL

-- 1. カラムが存在するか確認
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'wishlist' 
  AND column_name = 'is_someday';

-- 2. カラムが存在しない場合は追加（既に実行済みならエラーになるが問題なし）
ALTER TABLE IF EXISTS public.wishlist 
ADD COLUMN IF NOT EXISTS is_someday boolean NOT NULL DEFAULT false;

-- 3. 既存データの確認（is_somedayがnullや未設定のレコードがないか確認）
SELECT id, name, is_someday, month, deadline
FROM public.wishlist
ORDER BY created_at DESC
LIMIT 10;

-- 4. 既存データでis_somedayがnullの場合はfalseに更新（念のため）
UPDATE public.wishlist
SET is_someday = false
WHERE is_someday IS NULL;

