# PWAアイコンの作成方法

PWAを有効にするには、以下のアイコンファイルが必要です：

- `public/icon-192.png` (192x192ピクセル)
- `public/icon-512.png` (512x512ピクセル)

## アイコンの作成方法

### 方法1: オンラインツールを使用

1. [RealFaviconGenerator](https://realfavicongenerator.net/) にアクセス
2. アイコン画像をアップロード
3. 必要なサイズのアイコンを生成
4. 生成されたファイルを `public/` フォルダに配置

### 方法2: 画像編集ソフトを使用

1. 192x192ピクセルと512x512ピクセルのPNG画像を作成
2. `public/icon-192.png` と `public/icon-512.png` として保存

### 方法3: 仮のアイコンを作成（開発用）

開発中は、以下のコマンドで簡単なアイコンを作成できます：

```bash
# ImageMagickがインストールされている場合
convert -size 192x192 xc:black -pointsize 100 -fill white -gravity center -annotate +0+0 "W" public/icon-192.png
convert -size 512x512 xc:black -pointsize 300 -fill white -gravity center -annotate +0+0 "W" public/icon-512.png
```

または、オンラインのアイコンジェネレーターを使用して、簡単なアイコンを生成してください。

## 注意事項

- アイコンは正方形である必要があります
- PNG形式である必要があります
- 透明背景も使用可能です


