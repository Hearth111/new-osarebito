from flask import Blueprint

# 1. ブループリントを作成します。
# url_prefix をここで設定すると、このブループリント内の全ルートのURLの先頭に '/community' が付きます。
community = Blueprint('community', __name__, url_prefix='/community')

# 2. このブループリントに関連する各ファイルをインポートして、ルートなどを登録します。
# 循環参照を避けるため、このファイルの下部に配置するのが定石です。
from . import (
    views,
    post_routes,
    comment_routes,
    social_routes,
    poll_routes,
    moderation_routes,
    api_routes,
    posts_api,
    feeds,
    settings_routes
)