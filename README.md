# Web Text Reader 📖🔊

ウェブサイトの記事を音声で朗読するWebアプリケーションです。

🌐 **Live Demo**: [https://your-username.github.io/web-text-reader/](https://your-username.github.io/web-text-reader/)

## 🎯 機能

- 🌐 任意のURLから記事コンテンツを自動抽出
- 🎤 日本語対応のTTS（Text-to-Speech）機能
- ⏯️ 再生・一時停止・停止・速度調整
- 🎯 朗読箇所のリアルタイムハイライト
- 📍 文章クリックで任意の位置から再生開始
- 📱 モバイル対応のレスポンシブデザイン
- 🌙 ダークモード対応

## 📱 使い方

1. **URLを入力**: 朗読したい記事のURLを入力
2. **記事を取得**: ボタンをクリックして記事を抽出
3. **音声を選択**: お好みの日本語音声を選択
4. **再生開始**: 再生ボタンで朗読開始
5. **文章クリック**: 任意の文章をクリックしてその位置から再生

## 🎮 操作方法

### 基本操作
- **▶️ 再生**: 朗読を開始
- **⏸️ 一時停止**: 朗読を一時停止
- **⏹️ 停止**: 朗読を停止し、最初に戻る
- **速度調整**: スライダーで0.5x〜2.0xの速度調整

### 応用操作
- **文章クリック**: テキスト内の文をクリックでその位置から再生
- **音声選択**: ドロップダウンで音声の種類を変更
- **進捗確認**: プログレスバーで再生状況を確認

## 🛠️ 技術仕様

### フロントエンド
- HTML5 / CSS3 / JavaScript (ES6+)
- Web Speech API (ブラウザ標準TTS)
- レスポンシブデザイン
- Progressive Web App対応

### コンテンツ抽出
- AllOrigins API（CORS制約回避）
- DOM Parser（HTML解析）
- 自動コンテンツ検出

### 対応ブラウザ
- Chrome (推奨) 🟢
- Safari 🟡
- Firefox 🟡
- Edge 🟡

※ Web Speech API対応ブラウザが必要

## 📋 制限事項

- 一部のウェブサイトはセキュリティ制限によりアクセスできません
- 音声品質はブラウザ・OSに依存します
- スマートフォンでは自動再生ポリシーの制約があります

## 🔒 プライバシー

- すべての処理はブラウザ内で実行されます
- URLや記事内容は外部に保存されません
- 個人情報の収集は行いません

## 🚀 開発・貢献

### ローカル開発
```bash
git clone https://github.com/your-username/web-text-reader.git
cd web-text-reader
npm install
npm run dev
```

### デプロイ
```bash
npm run build
```

## 📄 ライセンス

MIT License

## 🙏 謝辞

- Web Speech API
- AllOrigins API
- GitHub Pages

---

Made with ❤️ for accessible web reading