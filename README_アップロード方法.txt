GitHub Pages アップロード用 v139（2026年5月ベネッセ共通テスト模試追加＋大問別入力バグ修正）

【アップロードするファイル】
- index.html
- answer_keys_mock_benesse_2026_05_verified_v2.json

【手順】
1. このZIPを解凍する。
2. GitHubリポジトリのルートに、上の2ファイルをアップロードする。
3. index.html は上書きする。
4. answer_keys_mock_benesse_2026_05_verified_v2.json も置く。
5. Commit changes を押す。

【重要】
- answer_keys_verified.json は上書きしない。
- この index.html が、既存 answer_keys_verified.json と模試用JSONをブラウザ側で統合する。
- v139では、数学・情報のように大問ごとに「ア」「イ」など同じ解答記号が出る科目で、入力が連動してしまう不具合を修正している。
