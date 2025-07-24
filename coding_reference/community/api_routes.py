# 業務自動化/app/community/api_routes.py

from flask import jsonify, request, url_for, render_template
from flask_login import current_user, login_required
from sqlalchemy.orm import joinedload
from sqlalchemy import or_
from app import db # socketioは不要になったため削除
from app.models import User, Post, Comment
from app.models import Notification # Notificationモデルをインポート
from . import community

@community.route('/api/search_users')
def search_users():
    """
    メンションのオートフィル用のユーザー検索API
    """
    query_text = request.args.get('q', '', type=str).strip()
    
    if not current_user.is_authenticated or not query_text:
        return jsonify([])

    search_term = f"%{query_text}%"

    users = User.query.options(joinedload(User.profile)).filter(
        # --- ここに条件を追加 ---
        User.username != 'admin',  # adminユーザーは常に除外
        # -----------------------
        or_(
            User.user_id.ilike(search_term),
            User.username.ilike(search_term)
        ),
        User.id != current_user.id
    ).limit(10).all()
    
    user_list = [
        {
            "key": f"{user.username} ({user.user_id})",
            "value": user.user_id,
            "username": user.username,
            "user_id": user.user_id,
            "avatar": url_for('static', filename='profile_pics/' + user.profile.image_file)
        }
        for user in users
    ]
    
    return jsonify(user_list)


@community.route('/notifications')
@login_required
def notifications():
    """
    現在のユーザーの通知をフェッチし、JSON形式で返すAPIエンドポイント。
    `base.html`から`navbar.html`を介して呼び出され、リアルタイム通知ドロップダウンに表示されます。
    """
    # 未読の通知を優先的に取得し、その後に既読の通知を新しい順に取得
    notifications = current_user.notifications.order_by(Notification.is_read.asc(), Notification.timestamp.desc()).limit(20).all()
    
    # 通知を既読にする前に、現在の未読数を取得
    unread_count_before_marking = current_user.new_notifications() # Notificationモデルにこのメソッドがあると仮定

    # 通知を既読にする
    for n in notifications:
        n.is_read = True
    db.session.commit()

    # 既読にした後の未読数を取得
    unread_count_after_marking = current_user.new_notifications()

    # JSONレスポンスとして通知データと未読数を整形して返す
    return jsonify({
        'notifications': [
            {
                'id': n.id,
                'name': n.name,
                'data': n.get_data(), # Notificationモデルのget_data()メソッドでpayload_jsonを辞書に変換
                'timestamp': n.timestamp,
                'is_read': n.is_read
            } for n in notifications
        ],
        'unread_count': unread_count_after_marking # 既読にした後の未読数を返す
    })


@community.route('/api/comment/<int:comment_id>/like', methods=['POST'])
def like_comment_api(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    if not current_user.is_authenticated:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    # ここはコメントのいいね機能であり、投稿のいいねとは別物です
    # Commentモデルに`is_liked_by`と`likes`が定義されている前提です
    # （提供されたコードベース全体からは確認できないため、この前提で記述）
    if hasattr(comment, 'is_liked_by') and comment.is_liked_by(current_user):
        # liked_commentsはUserモデルに定義されていると仮定
        current_user.liked_comments.remove(comment) 
        liked = False
    elif hasattr(current_user, 'liked_comments'):
        current_user.liked_comments.append(comment)
        liked = True
    else:
        # liked_commentsリレーションシップがUserモデルに設定されていない場合のフォールバック
        return jsonify({'success': False, 'error': 'コメントのいいねはサポートされていないか、設定が誤っています。'}), 500
    
    db.session.commit()
    return jsonify({'success': True, 'liked': liked, 'likes_count': comment.likes.count() if hasattr(comment, 'likes') else 0})

@community.route('/api/post/<int:post_id>/likers', methods=['GET'])
@login_required
def likers_modal_content(post_id):
    """
    投稿に「いいね」したユーザーのリストを返すAPI。
    モーダルに埋め込むためのHTMLフラグメントとして返却。
    """
    post = Post.query.get_or_404(post_id)
    page = request.args.get('page', 1, type=int)
    role_filter = request.args.get('role', 'all', type=str)

    # いいねしたユーザーのクエリを構築
    query = post.liked_by

    # ロールによるフィルタリング
    if role_filter != 'all':
        query = query.filter(User.role == role_filter)

    # ページネーションを適用
    likers_pagination = query.paginate(page=page, per_page=20, error_out=False)

    return render_template(
        'community/_likers_list.html',
        post=post,
        likers=likers_pagination,
        current_role_filter=role_filter
    )