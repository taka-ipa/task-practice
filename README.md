# 🎮 Game Training Task Tracker（MVP）
ゲーム練習の課題管理・振り返りアプリ（Splatoon / LoL対応予定）

---

## 📌 概要

このアプリは、ゲーム練習の効率を上げるための「課題トラッキングツール」です。

- その日の課題 A/B を２つ決める  
- 試合ごとに ○ / △ / × で評価する  
- 日別サマリーで振り返ることで成長が見える

複数ユーザー（4〜5人）でも利用可能な仕様になっています。

---

## 🔧 技術構成（Tech Stack）

### フロントエンド
- Next.js 15  
- React 18  
- TypeScript  
- Tailwind CSS  
- shadcn/ui  
- Axios  

### バックエンド
- Laravel 12  
- PHP 8.3  
- Laravel Sanctum（トークン認証）  
- MySQL 8  

### インフラ / 開発環境
- Docker / Docker Compose  
- Vercel（フロントデプロイ）  
- AWS（API / DB）予定  

---

## 🧱 機能（MVP）

### 🔐 認証
- メール + パスワードで登録 / ログイン
- ログアウト
- ログイン中ユーザーの取得（/api/user）

### 📝 今日の課題
- 課題一覧から 2 つ選択（A/B）
- 日別に保存（daily_task_assignments）

### 🎮 Match Reflection（試合振り返り）
- 課題ごとに ○ / △ / × を登録
- Notes（自由記述）
- 「Next Match」「Finish」操作

### 📅 日別サマリー
- 過去 7 日分の結果をまとめて表示
- 課題ごとに ○ △ × の数を集計

---

## 🗂 データベース構成（簡易ER図）



