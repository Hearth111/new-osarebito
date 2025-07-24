# app/community/feeds.py

from flask import render_template, redirect, url_for, flash, request
from flask_login import current_user, login_required
from flask_sqlalchemy.pagination import Pagination
from app.models import Post, User
from . import community
from .decorators import age_verified, check_banned

@community.route('/bookmarks')
@login_required
@age_verified
@check_banned
def bookmarks():
    """
    ユーザーがブックマークした投稿の一覧を表示するページ。
    データベースクエリでフィルタリングとページネーションを行い、パフォーマンスを向上させる。
    """
    page = request.args.get('page', 1, type=int)
    
    # --- 【ここからが修正箇所】 ---
    # ベースとなるクエリを作成 (ユーザーがブックマークした投稿)
    query = current_user.bookmarked_posts

    # ブロックしている/されているユーザーの投稿をクエリレベルで除外
    blocked_user_ids = [u.id for u in current_user.blocked]
    users_blocking_me_ids = [u.id for u in current_user.blocked_by]
    forbidden_ids = set(blocked_user_ids + users_blocking_me_ids)
    if forbidden_ids:
        query = query.filter(Post.user_id.notin_(forbidden_ids))

    # 成人向けコンテンツの表示設定でフィルタリング
    if not current_user.show_adult_content:
        query = query.filter(Post.is_adult == False)

    # クエリに対して最終的な順序付けとページネーションを適用
    posts_pagination = query.order_by(Post.created_at.desc()).paginate(page=page, per_page=100, error_out=False)
    # --- 修正ここまで ---

    return render_template('community/bookmarks.html', title='ブックマーク一覧', posts=posts_pagination)