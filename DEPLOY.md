# Vercelデプロイ手順

## 前提条件

- GitHubアカウント
- Vercelアカウント（[vercel.com](https://vercel.com)で作成）
- Supabaseプロジェクト（環境変数URL/Keyを取得済み）

## 手順

### 1. GitHubリポジトリにプッシュ

```bash
# まだGitリポジトリでない場合
git init
git add .
git commit -m "Initial commit"

# GitHubでリポジトリを作成後
git remote add origin https://github.com/あなたのユーザー名/wishlist-app.git
git branch -M main
git push -u origin main
```

### 2. Vercelでプロジェクトをインポート

1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. 「Add New...」→「Project」を選択
3. GitHubリポジトリを選択（または「Import Git Repository」でURLを入力）
4. プロジェクト設定：
   - **Framework Preset**: Next.js（自動検出）
   - **Root Directory**: `./`（そのまま）
   - **Build Command**: `npm run build`（デフォルト）
   - **Output Directory**: `.next`（デフォルト）
   - **Install Command**: `npm install`（デフォルト）

### 3. 環境変数を設定

Vercelのプロジェクト設定画面で以下を追加：

| 名前 | 値 |
|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | あなたのSupabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | あなたのSupabase Anon Key |

**設定手順**:
1. プロジェクト設定画面 → 「Environment Variables」
2. 各変数を追加（Production/Preview/Developmentすべてに適用推奨）
3. 「Save」をクリック

### 4. デプロイ

1. 「Deploy」ボタンをクリック
2. ビルドが完了するまで待機（通常1-3分）
3. デプロイ完了後、表示されたURL（例: `https://wishlist-app.vercel.app`）でアクセス可能

### 5. SupabaseのリダイレクトURL設定（重要）

Supabaseダッシュボードで以下を設定：

1. **Authentication** → **URL Configuration**
2. **Redirect URLs**に以下を追加：
   ```
   https://あなたのプロジェクト名.vercel.app
   https://あなたのプロジェクト名.vercel.app/**
   ```
   （カスタムドメインを使う場合はそのドメインも追加）

### 6. 動作確認

- トップページが表示される
- 新規登録ができる
- データが保存・表示される

## トラブルシューティング

### ビルドエラー

- **エラー**: `NEXT_PUBLIC_SUPABASE_URL is not defined`
  - **解決**: 環境変数が正しく設定されているか確認（Vercelの「Settings」→「Environment Variables」）

### ランタイムエラー

- **エラー**: `cookieStore.get is not a function`
  - **解決**: サーバーアクション側で匿名クライアントを使用しているため、通常は発生しないはず。もし出る場合は、`.env.local`の設定を確認

### データが表示されない

- SupabaseのRLSポリシーが正しく設定されているか確認
- ブラウザのコンソールでエラーを確認

## カスタムドメイン設定（オプション）

1. Vercelプロジェクト設定 → 「Domains」
2. ドメインを追加
3. DNSレコードを設定（Vercelの指示に従う）

## 継続的なデプロイ

- `main`ブランチへのプッシュで自動デプロイ
- プルリクエストでプレビューデプロイが自動生成

## 参考リンク

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Supabase Documentation](https://supabase.com/docs)

