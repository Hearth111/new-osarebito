# osarebito

## 概要

このプロジェクトは FastAPI と Next.js を用いた SNS プラットフォームです。
バックエンドのデータ保存方法を JSON ファイルから SQLite へ変更しました。

## SQLite への移行

`osarebito-backend/migrate_json.py` を実行すると、従来の JSON ファイル
（`osarebito-backend/app/*.json`）に保存されたデータを SQLite にインポートできます。
環境変数 `DATABASE_URL` で接続先を指定できます。

```bash
cd osarebito-backend
python migrate_json.py
```

デフォルトでは `sqlite:///osarebito.db` に接続します。

## 起動方法

```bash
# バックエンド
python run_backend.py  # 初回実行時に仮想環境を自動生成

# Windows の場合
run_backend.bat


# フロントエンド
npm --prefix osarebito-frontend run dev
```

`run_backend.py` は仮想環境が存在しない場合、自動で作成して必要な
依存パッケージをインストールします。これにより、複数の PC でクローン
した直後でも同じ手順でデバッグを開始できます。
