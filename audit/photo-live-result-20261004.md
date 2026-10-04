# 写真読取の実動作確認（2026-10-04 14:04 JST）

公開サイトへ、数字のマークと未記入欄を含む12欄の検証用画像を実際に投入しました。正解が既知の生成画像を使用しており、実物の答案写真ではありません。

- 実行: https://github.com/aykuno/exam.kyoutu.selfcheck/actions/runs/37178790284
- 画像生成とChromiumによる公開サイト操作は成功。
- App Checkのトークン交換はHTTP 403。
- GoogleのgenerateContent呼び出しもHTTP 403。
- APIは「Firebase AI Logic has been deactivated in this project. To resume using Firebase AI Logic, you must enforce Firebase App Check.」を返却。
- 認識結果は返っていないため正答率は測定不能。「0/12」と解釈しないこと。
- 同じプロジェクトの認証エラーを繰り返さないため、残りの負号・英字画像による呼び出しは中止。
- サイトのエラー表示では同じ写真で再試行できることを確認。
- メインブランチ、正解データ、採点規則、Firebaseの管理設定に変更は加えていません。

公式資料:
https://firebase.google.com/docs/ai-logic/error-codes
https://firebase.google.com/docs/ai-logic/app-check

必要な復旧は、FirebaseコンソールのSecurity > App Check > APIs > Firebase AI LogicでBaseline protectionをEnforcedにすること、および本番WebアプリのreCAPTCHA Enterprise認証を成立させることです。管理画面にアクセスする手段がこの実行環境にないため、復旧操作は未実施です。CI環境での認証検証には、公式手順による非公開の登録済みデバッグトークンが別途必要になる場合があります。トークンや秘密情報は記録・公開していません。
