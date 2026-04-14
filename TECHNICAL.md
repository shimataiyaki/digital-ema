# デジタル絵馬 技術解説 (TECHNICAL.md)

## 1. 概要
- **プロダクト名**：デジタル絵馬 (digital-ema)
- **公開URL**：【GAS】
- **リポジトリ**：【https://github.com/shimataiyaki/digital-ema】
- **技術スタック**：Google Apps Script (GAS), Google Spreadsheet, Google Forms, HTML/CSS/JavaScript (ES6)

## 2. アーキテクチャ概要
本プロダクトは、Google Workspace エコシステム上で完結する **サーバーレス Web アプリ** である。

```
[Chromebook] → (1) Googleフォーム送信 → [Googleスプレッドシート] (自動保存)
                                              ↓ (2) GASがデータ取得
[大型モニター] ← (3) GAS Web App が HTML 配信 ← [GAS]
                     ↳ 20秒間隔で最新6件を再取得・再描画
```

- **バックエンド**：GAS がスプレッドシートを読み取り、RESTful ライクなエンドポイントとして機能する（実際は `google.script.run` による RPC）。
- **フロントエンド**：GAS テンプレート HTML 上で動作するシングルページアプリケーション (SPA) 風 UI。
- **データストア**：Google スプレッドシート（NoSQL 的なフラットテーブル）。

## 3. 技術スタック詳細

### 3.1 Google Apps Script (GAS)
| 要素 | 採用理由 |
|:---|:---|
| **`doGet()`** | ウェブアプリとして公開するためのエントリポイント。`HtmlService` で `index.html` を返却。 |
| **`getLatestWishes()`** | スプレッドシートから最新6件の願い事を取得する内部 API。フロントから非同期呼び出しされる。 |
| **Quota 対策** | 1日の合計実行時間 90分 制限を考慮し、クライアントサイドでのポーリング間隔を 20秒 に設定。1回の処理時間は約 0.5〜1 秒に抑えている。 |

### 3.2 フロントエンド (HTML/CSS/JavaScript)
| 技術 | 役割 |
|:---|:---|
| **CSS Grid** | 3列×2行の絵馬グリッドをレスポンシブに構築。 |
| **`google.script.run`** | GAS 関数を非同期実行し、コールバックで DOM を更新。 |
| **`setInterval`** | 20秒周期のポーリングを実装。バックグラウンド更新による UX 向上。 |
| **CSS 疑似要素** | `::before` で絵馬の「穴」と「紐」を表現。画像を使わず軽量に実現。 |

### 3.3 Google スプレッドシート / フォーム
- **スキーマ**：
  - A列：タイムスタンプ (自動)
  - B列：願い事 (テキスト)
  - C列：ニックネーム (テキスト)
- **データ取得の最適化**：
  - `getRange(2, 2, lastRow-1, 2)` で必要列のみ取得し、転送量を最小化。
  - 最新順にするため、取得後 `reverse()` でクライアント側に返却。

## 4. キーコード解説

### 4.1 GAS データ取得関数 (`コード.gs`)

```javascript
function getLatestWishes() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var range = sheet.getRange(2, 2, lastRow - 1, 2); // B列・C列
  var values = range.getValues();
  
  var wishes = [];
  for (var i = values.length - 1; i >= 0; i--) {
    var wish = values[i][0], nickname = values[i][1];
    if (wish) {
      wishes.push({
        nickname: nickname || '匿名',
        wish: wish
      });
    }
  }
  return wishes; // 最新順
}
```

**ポイント**：
- `getActiveSheet()` でシート名に依存しない堅牢性を確保（シート名変更にも対応）。
- 空文字チェックでノイズを除外。

### 4.2 フロントエンド更新ロジック (`index.html`)

```javascript
function updateEma() {
  google.script.run.withSuccessHandler(function(wishes) {
    const grid = document.getElementById('emaGrid');
    grid.innerHTML = '';
    // ... 最大6件を描画 ...
  }).getLatestWishes();
}
setInterval(updateEma, 20000);
```

**設計意図**：
- `withSuccessHandler` で非同期レスポンスを処理。
- 全件再描画方式により、状態管理を簡素化。描画コストは軽微。

### 4.3 絵馬カード CSS

```css
.ema-card {
  background-color: #fcf3e0;
  border: 6px solid #b87c4b;
  border-radius: 20px 20px 8px 8px;
  box-shadow: 10px 10px 0 #2b1a0f;
  position: relative;
}
.ema-card::before {
  content: "";
  position: absolute;
  top: -20px; left: 50%;
  transform: translateX(-50%);
  width: 30px; height: 30px;
  background-color: #d4a373;
  border: 4px solid #b87c4b;
  border-radius: 50%;
}
```

**ポイント**：
- `border-radius` の非対称指定で五角形風のフォルムを実現。
- `box-shadow` で立体感を演出し、神社の木製絵馬の質感を再現。

## 5. パフォーマンスと制限への対応

### 5.1 GAS 実行制限 (90分/日)
- 1回の `getLatestWishes()` 実行時間：約 0.8 秒（実測）
- 20秒間隔 → 1時間あたり 180 回実行 → 消費時間 144 秒/時 (2.4 分/時)
- 6時間営業でも **14.4 分** の消費で余裕を持ってクリア。

### 5.2 同時接続
- 本プロダクトは**表示側が単一クライアント**（大型モニター用PC）のため、GAS 同時実行数制限（30）は全く問題にならない。

### 5.3 ネットワーク負荷
- レスポンスデータは最大6件 × 2フィールド（JSON）で 1KB 未満。
- 20秒間隔のポーリングでも帯域消費はほぼ無視できるレベル。

## 6. デプロイと運用フロー

### 6.1 初回デプロイ
1. GAS エディタで「デプロイ」→「新しいデプロイ」
2. 種類：「ウェブアプリ」、アクセス権：「全員」
3. 発行された URL を管理用 PC で開き、`F11` で全画面表示。

### 6.2 コード修正時のアップデート (URL 維持)
```text
[デプロイ] → [デプロイを管理] → 該当デプロイの鉛筆アイコン
→ バージョン: [新バージョン] → [デプロイ]
```
- これにより、本番 URL を変更せずにアプリを更新可能。当日の急な修正にも強い。

### 6.3 開発中の動作確認
- GAS エディタの「デバッグ」機能で一時 URL を発行し、本番環境と分離してテストする。

## 7. セキュリティ・イタズラ対策

| 対策 | 実装状況 |
|:---|:---|
| **フォーム URL 非公開** | リンクを知る来場者のみアクセス可能。 |
| **NG ワードフィルター** | GAS コード内で置換ロジックを追加可能（現在は未実装だが拡張性あり）。 |
| **表示データの一時性** | スプレッドシートのデータは文化祭終了後に手動で全削除する運用。 |
| **CORS / クリックジャッキング** | `HtmlService` がデフォルトで適切なヘッダを付与。 |

## 8. 拡張可能性と今後の展望

- **おみくじ連携**：二進数おみくじの結果をクエリパラメータで受け取り、絵馬の背景色を変化させる。
- **リアルタイム性向上**：WebSocket や Google Realtime API の採用（ただし文化祭規模ではオーバースペック）。
- **データ可視化**：蓄積した願い事をワードクラウド化し、展示最終日に投影する。

## 9. 開発を振り返って

本プロダクトは、**「サーバー代0円・開発環境0円・運用コスト0円」** という極限までコストを削減した構成でありながら、実用的なリアルタイム性と高いデザイン性を両立した。Google Workspace をフル活用することで、情報系部活の文化祭展示に最適化されたアーキテクチャとなっている。

## 10. 参考リンク
- [Google Apps Script ドキュメント](https://developers.google.com/apps-script)
- [MIT License](https://opensource.org/licenses/MIT)

---

© 2026 Shimataiyaki
