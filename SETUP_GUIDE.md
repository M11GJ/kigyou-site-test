# Googleスプレッドシート セットアップガイド

このガイドでは、「最近の活動」をGoogleスプレッドシートで管理するための設定方法を説明します。

---

## Step 1: スプレッドシートを作成

1. [Googleスプレッドシート](https://sheets.google.com) を開く
2. **「空白」** をクリックして新しいスプレッドシートを作成
3. 名前を「起業部 活動記録」などに変更
4. **1行目（ヘッダー）** に以下を入力:

| A1 | B1 | C1 |
|:---|:---|:---|
| 日付 | タイトル | 内容 |

5. **2行目以降** にサンプルデータを入力:

| A列 | B列 | C列 |
|:---|:---|:---|
| 2025-12-15 | 冬合宿開催 | チームビルディングを行いました。 |
| 2025-11-20 | ビジネスコンテスト参加 | 地域ビジネスコンテストで発表しました。 |

> ⚠️ **日付の形式**: `YYYY-MM-DD`（例: 2025-12-15）を推奨

---

## Step 2: Apps Scriptを追加

1. スプレッドシートで **「拡張機能」→「Apps Script」** をクリック
2. 表示されたコードをすべて削除し、以下をコピー＆ペースト:

```javascript
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // ヘッダー行をスキップ
  data.shift();
  
  // データを整形
  const activities = data
    .filter(row => row[0] && row[1]) // 日付とタイトルが空でない行のみ
    .map(row => ({
      date: formatDate(row[0]),
      title: row[1],
      content: row[2] || ''
    }));
  
  return ContentService.createTextOutput(JSON.stringify(activities))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatDate(value) {
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  return String(value);
}
```

3. **Ctrl + S** (Mac: **Cmd + S**) で保存
4. プロジェクト名を入力（例: 「活動データAPI」）

---

## Step 3: Web Appとしてデプロイ

1. **「デプロイ」→「新しいデプロイ」** をクリック
2. **「種類の選択」** で ⚙️（歯車アイコン）→ **「ウェブアプリ」** を選択
3. 以下の設定を入力:

| 項目 | 設定値 |
|:---|:---|
| 説明 | 活動データAPI |
| 次のユーザーとして実行 | 自分 |
| アクセスできるユーザー | **全員** |

4. **「デプロイ」** をクリック
5. **「アクセスを承認」** をクリックし、Googleアカウントでログイン
6. 「このアプリは確認されていません」と表示されたら:
   - **「詳細」** をクリック
   - **「（プロジェクト名）（安全でないページ）に移動」** をクリック
   - **「許可」** をクリック
7. 表示された **「ウェブアプリのURL」** をコピー

> 📋 URLは `https://script.google.com/macros/s/xxxxx/exec` の形式です

---

## Step 4: サイトにURLを設定

1. `js/activity-loader.js` を開く
2. 以下の行を見つける:

```javascript
const WEB_APP_URL = 'YOUR_WEB_APP_URL_HERE';
```

3. `YOUR_WEB_APP_URL_HERE` を先ほどコピーしたURLに置き換え:

```javascript
const WEB_APP_URL = 'https://script.google.com/macros/s/xxxxx/exec';
```

4. ファイルを保存

---

## 動作確認

1. ブラウザで `activity.html` を開く
2. スプレッドシートのデータが表示されることを確認
3. スプレッドシートに新しい行を追加し、ページをリロードして反映されるか確認

---

## 部員向け運用マニュアル

### 活動を追加する方法

1. [スプレッドシート](あなたのスプレッドシートのURLに置き換え) を開く
2. 最終行の下に新しい行を追加
3. 3つのセルを埋める:
   - **日付**: `2025-12-15` の形式
   - **タイトル**: イベント名（20文字程度）
   - **内容**: 詳細説明（100文字程度）
4. サイトをリロードすると自動的に反映されます

### 注意事項
- 日付が新しいものが上に表示されます（自動ソート）
- 空行は無視されます
- HTMLタグは使用できません（自動でエスケープされます）

---

## トラブルシューティング

| 問題 | 解決方法 |
|:---|:---|
| データが表示されない | ブラウザの開発者ツール（F12）でConsoleのエラーを確認 |
| 「読み込み中...」のまま | Web App URLが正しく設定されているか確認 |
| 古いデータが表示される | Apps Scriptを再デプロイ（新しいバージョン） |
| CORSエラー | デプロイ設定で「アクセスできるユーザー」が「全員」になっているか確認 |

---

## Step 5: GitHub Secretsを設定（任意・自動更新用）

GitHub Actionsで1時間ごとに自動でデータを更新する場合の設定です。

1. GitHubリポジトリを開く
2. **Settings → Secrets and variables → Actions** をクリック
3. **New repository secret** をクリック
4. 以下を入力:
   - **Name**: `SPREADSHEET_API_URL`
   - **Secret**: Step 3でコピーしたWeb App URL
5. **Add secret** をクリック

設定後、GitHub Actionsが1時間ごとに`data/activities.json`を自動更新します。

