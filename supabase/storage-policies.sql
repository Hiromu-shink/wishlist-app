-- Supabase Storage ポリシー設定
-- wishlistバケットで画像のアップロードと公開読み取りを許可

-- 1. バケットが存在するか確認（存在しない場合は作成）
-- 注意: バケットはSupabaseダッシュボードのStorageから手動で作成してください
-- バケット名: wishlist
-- Public: ON

-- 2. 公開読み取りポリシー（誰でも画像を閲覧可能）
CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects
FOR SELECT
USING (bucket_id = 'wishlist');

-- 3. 公開アップロードポリシー（誰でもアップロード可能）
CREATE POLICY IF NOT EXISTS "Public Upload" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'wishlist');

-- 4. 公開更新ポリシー（誰でも更新可能）
CREATE POLICY IF NOT EXISTS "Public Update" ON storage.objects
FOR UPDATE
USING (bucket_id = 'wishlist')
WITH CHECK (bucket_id = 'wishlist');

-- 5. 公開削除ポリシー（誰でも削除可能）
CREATE POLICY IF NOT EXISTS "Public Delete" ON storage.objects
FOR DELETE
USING (bucket_id = 'wishlist');

-- 既存のポリシーを確認
SELECT * FROM storage.policies WHERE bucket_id = 'wishlist';

