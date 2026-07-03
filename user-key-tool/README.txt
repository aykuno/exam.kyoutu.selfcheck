user-key-tool isolated package

概要
- 既存メインサイトとは完全分離したユーザー正答登録・採点テスト用ページです。
- 本体の index.html / pdf_export_v160.js / answer_keys_verified.json / statistics_final.json は含めていません。
- 既存の採点ロジック・公式正答データ・PDF本体ファイルを変更しません。

含まれるファイル
- user-key-builder.html
  ユーザー正答データ作成ページ。まとめて正答登録、カード式入力、配点設定、保存済みデータ管理。
- user-key-scoring-test.html
  登録済みユーザー正答データを使う採点テストページ。
- user-key-scoring-test.css
  採点テストページ用CSS。
- user-key-scoring-test.js
  採点テストページ用JS。
- user-key-scoring-test-pdf-adapter.js
  採点テストページとPDF出力をつなぐ分離アダプター。
- user-key-pdf-v160-isolated.js
  pdf_export_v160.js を分離コピーしたもの。既存本体の pdf_export_v160.js へ依存しません。

保存キー
- ユーザー登録正答データ: ct-marker-user-answer-keys-v1
- ユーザー解答保存: ct-marker-user-answers-v1

公開時の置き場所
GitHub Pagesでは、リポジトリ内に user-key-tool/ フォルダを作り、このフォルダ内のファイルをそのまま置いてください。

想定URL
https://<ユーザー名>.github.io/<リポジトリ名>/user-key-tool/user-key-builder.html
https://<ユーザー名>.github.io/<リポジトリ名>/user-key-tool/user-key-scoring-test.html

注意
- index.html へのリンク追加はしていません。
- 既存メインサイトへ統合していません。
- 既存PDFファイル pdf_export_v160.js は上書きしません。
- PDF出力は、このフォルダ内の user-key-pdf-v160-isolated.js を読み込みます。
