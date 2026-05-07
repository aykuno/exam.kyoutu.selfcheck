GitHub Pages 公開用パッケージ / kyotei-marker v76

これは Netlify 用 v76 を GitHub Pages でも公開しやすいようにした展開済みファイル一式です。

重要：
- GitHub Pages は ZIP をそのままアップロードして公開する方式ではありません。
- この ZIP を自分のPCで展開し、中身のファイル/フォルダを GitHub リポジトリのルートへアップロードしてください。
- リポジトリのルート直下に index.html が来る必要があります。
- .nojekyll は削除しないでください。
- _headers は Netlify 用です。GitHub Pages では基本的に無視されますが、残しても問題ありません。
- robots.txt と meta noindex は残しています。ただし GitHub Pages では Netlify の X-Robots-Tag ヘッダーは効きません。

アップロードする中身：
- index.html
- robots.txt
- _headers
- .nojekyll
- README_NETLIFY.txt
- README_GITHUB_PAGES.txt
- ccd518f25dc2badf6389310f65be325d2c125306fa8fb21d3fe1f34a9f837385/ フォルダ一式

公開手順の概略：
1. GitHubで新しいリポジトリを作る。
2. このZIPをPCで展開する。
3. 展開した中身をリポジトリのルートへアップロードしてCommitする。
4. Settings → Pages → Build and deployment → Source を Deploy from a branch にする。
5. Branch を main、Folder を / root にしてSaveする。
6. 数分後、PagesのURLへアクセスする。

通常のURL：
https://<ユーザー名>.github.io/<リポジトリ名>/

パスワード：
Ur4mgW7Z
