# Node公式イメージ（LTSでOK。20でも18でも可）
FROM node:20

# 作業ディレクトリ
WORKDIR /app

# 依存関係インストール用に package.json だけ先にコピー
COPY package*.json ./

# 本番じゃないし dev 環境だから npm ci でも npm install でもOK
RUN npm ci --no-audit --progress=false || npm install

# 残りのソースをコピー
COPY . .

# ポート3000使うよ、の宣言（なくても動くけど一応）
EXPOSE 3000

# 実際の起動コマンドは docker-compose.yml の command で上書きされるから
# ここはダミーでOK
CMD ["npm", "run", "dev"]
