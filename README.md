# osarebito

## 概要

このプロジェクトは FastAPI と Next.js を用いた SNS プラットフォームです。
バックエンドのデータ保存方法を JSON ファイルから PostgreSQL へ移行しました。

## PostgreSQL への移行

`osarebito-backend/migrate_json.py` を実行すると、従来の JSON ファイル
（`osarebito-backend/app/*.json`）に保存されたデータを PostgreSQL にインポートできます。
環境変数 `DATABASE_URL` で接続先を指定してください。

```bash
cd osarebito-backend
python migrate_json.py
```

デフォルトでは `postgresql+psycopg2://postgres:postgres@localhost/osarebito`
に接続します。

## 起動方法

```bash
# バックエンド
python run_backend.py

# フロントエンド
npm --prefix osarebito-frontend run dev
```
