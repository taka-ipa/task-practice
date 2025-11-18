# PHP本体（CLI版）の公式イメージ
FROM php:8.2-cli

# 必要なパッケージと拡張モジュールをインストール
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
  && docker-php-ext-install pdo_mysql zip \
  && rm -rf /var/lib/apt/lists/*

# Composer を追加（公式 Composer イメージからコピー）
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 作業ディレクトリ（ここに Laravel プロジェクトが入る想定）
WORKDIR /var/www/html
