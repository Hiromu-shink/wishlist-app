This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## PWA (Progressive Web App)

このアプリはPWAとして動作します。以下の機能が利用できます：

- **オフライン対応**: Service Workerにより、オフラインでも基本的な機能が利用可能
- **ホーム画面に追加**: スマートフォンやタブレットのホーム画面に追加可能
- **スタンドアロンモード**: アプリのように全画面表示

### アイコンの生成

アイコンを再生成する場合：

```bash
npm run generate-icons
```

これにより、`public/icon-192.png`と`public/icon-512.png`が生成されます。

### PWAの確認方法

1. 本番ビルドを実行: `npm run build && npm start`
2. Chrome DevTools → Application → Manifest で確認
3. 「ホーム画面に追加」が表示されることを確認

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
