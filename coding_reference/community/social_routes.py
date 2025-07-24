# work/app/community/social_routes.py

from flask import jsonify, url_for
from flask_login import current_user, login_required
from app import db, socketio
from app.models import Post, Tag # Tagモデルをインポート
from . import community
from .decorators import age_verified, check_banned

@community.route('/api/post/<int:post_id>/like', methods=['POST'])
@login_required
@age_verified
@check_banned
def like_post(post_id):
    """
    投稿に「いいね」を追加または削除し、結果をリアルタイムでクライアントに通知する。
    """
    post = Post.query.get_or_404(post_id)
    
    # いいねの状態をトグル
    if post.is_liked_by(current_user):
        current_user.liked_posts.remove(post)
        status = 'unliked'
        liked = False # JSが期待するlikedステータス
    else:
        current_user.liked_posts.append(post)
        status = 'liked'
        liked = True # JSが期待するlikedステータス
        # 自分以外のユーザーの投稿にいいねした場合、通知を作成
        if post.author != current_user:
            notification = post.author.add_notification(
                'new_like',
                {
                    'liker_username': current_user.username, 
                    'post_id': post.id, 
                    'post_content': post.content[:30]
                }
            )
            # 通知は即座にデータベースに保存
            if notification:
                db.session.add(notification)
                db.session.commit() # 先にコミットして通知IDを確定
                socketio.emit('new_notification',
                              {
                                'name': 'new_like',
                                'data': notification.get_data()
                              },
                              to=post.author.id)

    # いいねの総数を取得
    likes_count = post.liked_by.count()
    
    # いいねの状態変更をコミット
    db.session.commit()

    # Socket.IO を使って、関係するクライアントにリアルタイムで更新を通知
    socketio.emit('update_like_count', {
        'post_id': post_id,
        'count': likes_count,
        'status': status,
        'user_id': current_user.id # どのユーザーのアクションによるものか
    })

    # APIレスポンスとして、アクションの最終状態を返す
    return jsonify({'success': True, 'liked': liked, 'likes_count': likes_count})


@community.route('/api/post/<int:post_id>/bookmark', methods=['POST'])
@login_required
@age_verified
@check_banned
def bookmark_post(post_id):
    """
    投稿をブックマークまたはブックマーク解除する。
    """
    post = Post.query.get_or_404(post_id)
    if post.is_bookmarked_by(current_user):
        current_user.bookmarked_posts.remove(post)
        status = 'unbookmarked'
    else:
        current_user.bookmarked_posts.append(post)
        status = 'bookmarked'
    
    db.session.commit()
    return jsonify({'success': True, 'status': status})


@community.route('/tag/<string:tag_name>/favorite', methods=['POST'])
@login_required
def favorite_tag_action(tag_name):
    """タグをお気に入り登録/解除するAPIエンドポイント"""
    # タグ名の前後の空白を削除し、#を除去
    cleaned_tag_name = tag_name.strip().lstrip('#')
    if not cleaned_tag_name:
        return jsonify({'status': 'error', 'message': 'タグ名が無効です。'}), 400

    tag = Tag.query.filter_by(name=cleaned_tag_name).first()
    if tag is None:
        # もしタグが存在しなければ、新しく作成する
        tag = Tag(name=cleaned_tag_name)
        db.session.add(tag)
    
    if current_user.is_favoriting_tag(tag):
        current_user.unfavorite_tag(tag)
        db.session.commit()
        return jsonify({'status': 'unfavorited', 'tag_name': tag.name, 'message': f'タグ「{tag.name}」をお気に入りから削除しました。'})
    else:
        current_user.favorite_tag(tag)
        db.session.commit()
        return jsonify({'status': 'favorited', 'tag_name': tag.name, 'message': f'タグ「{tag.name}」をお気に入りに追加しました。'})