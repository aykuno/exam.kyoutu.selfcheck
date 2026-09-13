# PDF発行方式の検証

バージョン：v1.0.1  
最終更新：2026/09/13 11:53（日本時間）

新資料「PDF発行の仕組み解説」に従った独立実装です。前回の `pdf-method-trial/` と本体サイトのファイルは変更しません。

## 使用方法

このフォルダの公開ページで「新資料の方式でPDFを生成」を押し、表示された「ダウンロード」または「新しいタブで開く」を選びます。外部API、CDN、追加ライブラリは不要です。HTMLと同じフォルダにある `app.js` だけを読み込みます。

## 新資料との対応

| 関数 | 内容 |
| --- | --- |
| `buildSVG(data, pageIndex)` | 図・表・日本語をXMLエスケープし、SVG文字列を生成 |
| `svgToJpegBytes(svgStr, w, h)` | 日本語をUTF-8化してSVGのdata URIを生成。Image→Canvasで、縦横比を保って中央配置しJPEG品質0.98で書き出す |
| `buildPdfBytes(pages)` | Catalog・Pages・Page・Contents・Imageとxref・trailerを文字列で組み立て、Uint8Arrayを返す |
| `triggerDownload(pdfBytes, filename)` | 8192バイトずつ変換してBase64化し、data URIの手動リンクを2つ提示 |

出力はA4縦・2ページ、画像は2480×3508px（約300dpi）です。新資料に記載されたB5横は座席表の例なので、採点結果に合わせてA4縦を使用しています。各CanvasはJPEG変換後に解放します。

「新しいタブで開く」は `<a target="_blank">` を利用し、`window.open()`・印刷・自動クリックは使いません。data URIの新規タブ表示の可否はブラウザーに依存します。リンクを実装したことだけをもってSafari対応とは判定しません。

## 検証データと範囲

- 前回と同じ国語36項目のテスト入力（1項目入力、35項目未入力）をHTMLに同梱しています。個人の実成績ではありません。
- 本体サイトへの書き込みや、親フォルダのデータ取得は行いません。
- 図・表の配置は前回の検証版を流用しています。本体サイトの版面の完全再現や採点機能の変更は対象外です。
- PDF内の文字は画像となるため、テキスト選択・検索はできません。
- JavaScript構文とPDF組立処理はブラウザー外でも検証します。Safari実機の生成・保存は未検証です。

## ファイルとライセンス

`index.html`（画面・テストデータ）、`app.js`（4段階の処理）、`README.md`、`LICENSE` をこのフォルダだけに追加します。ソースコードはMIT License。既存ファイルや参照資料のライセンスは変更しません。

## ブラウザー検証結果（2026/09/13）

- 公開ページをChromeで開き、SVG → Canvas → JPEG → PDFの生成に成功。
- 手動の「ダウンロード」でPDFファイルを保存できました。A4・2ページで、日本語・表・ページ番号の描画を確認しています。
- 「新しいタブで開く」は `about:blank#blocked` となり、PDFを表示できませんでした。data URIのトップレベル遷移が制限される挙動です。この環境ではダウンロードを使います。
- Safari実機では未検証です。Chromeの結果をSafariの動作保証とはしていません。
- v1.0.1では、検証で見つかったレーダーチャートの見出しと第1問ラベルの重なりを調整しました。

参考：[MDN — data URLsのSecurity issues](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data#security_issues)
