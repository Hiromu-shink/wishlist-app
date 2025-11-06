-- Supabase Storage セットアップ手順

-- 注意: バケットはSupabaseダッシュボードのStorageから手動で作成してください
-- 1. Storage → New bucket
-- 2. バケット名: wishlist
-- 3. Public: ON に設定
-- 4. 作成

-- バケット作成後、以下のポリシーを実行してください

-- 既存のポリシーを削除（エラーが出ても問題なし）
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

-- 公開読み取りポリシー（誰でも画像を閲覧可能）
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'wishlist');

-- 公開アップロードポリシー（誰でもアップロード可能）
CREATE POLICY "Public Upload" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'wishlist');

-- 公開更新ポリシー（誰でも更新可能）
CREATE POLICY "Public Update" ON storage.objects
FOR UPDATE
USING (bucket_id = 'wishlist')
WITH CHECK (bucket_id = 'wishlist');

-- 公開削除ポリシー（誰でも削除可能）
CREATE POLICY "Public Delete" ON storage.objects
FOR DELETE
USING (bucket_id = 'wishlist');

