# 業務自動化/app/community/post_routes.py

from flask import render_template, redirect, url_for, flash, request, jsonify, current_app, abort
from flask_login import login_required, current_user
from . import community
from app import db, socketio, limiter
from app.models import Post, User, Comment, Category, Tag, EditHistory
from .forms import PostForm
from app.utils.image_utils import save_picture
import os
import re
import secrets
from datetime import datetime # 編集時の履歴保存用にdatetimeをインポート

@community.route('/post/new', methods=['GET', 'POST'])
@login_required
@limiter.limit('10 per minute')
def new_post():
    """新しい投稿を作成するためのルート。モーダル表示とフォーム送信を処理する。"""
    form = PostForm()
    form.categories.choices = [(c.id, c.name) for c in Category.query.filter_by(type='post').order_by('id').all()]

    if request.method == 'POST':
        if form.validate_on_submit():
            status = 'draft' if 'submit_draft' in request.form else 'published'
            media_filename, media_type = None, None

            if form.media_file.data:
                try:
                    media_filename = save_picture(form.media_file.data, output_folder='community_uploads')
                    ext = media_filename.rsplit('.', 1)[1].lower()
                    if ext in ['png', 'jpg', 'jpeg', 'gif', 'webp']:
                        media_type = 'image'
                    else:
                        media_type = 'other'
                except ValueError as e:
                    return jsonify({'success': False, 'message': str(e)}), 400
                except Exception:
                    return jsonify({'success': False, 'message': 'ファイルのアップロード中にエラーが発生しました。'}), 500

            post = Post(
                content=form.content.data,
                author=current_user,
                status=status,
                comment_permission=','.join(form.comment_permission.data),
                visibility=form.visibility.data,
                is_adult=form.is_adult.data,
                is_anonymous=form.is_anonymous.data,
                media_filename=media_filename,
                media_type=media_type
            )

            selected_categories = Category.query.filter(Category.id.in_(form.categories.data)).all()
            post.categories.extend(selected_categories)

            # --- ▼▼▼ ここからがタグの修正点です ▼▼▼ ---
            if form.tags.data:
                # フォームクラスに定義したclean_tagsメソッドで、#を除去したタグリストを取得
                cleaned_tags = form.clean_tags(form.tags.data)
                for tag_name in cleaned_tags:
                    # DBには#無しのタグ名を保存
                    tag = Tag.query.filter_by(name=tag_name).first() or Tag(name=tag_name)
                    post.tags.append(tag)
            # --- ▲▲▲ ここまでがタグの修正点です ▲▲▲ ---

            if form.visibility.data == 'private' and form.accessible_users.data:
                usernames = [uname.strip() for uname in form.accessible_users.data.split(',') if uname.strip()]
                if usernames:
                    users = User.query.filter(User.username.in_(usernames)).all()
                    post.accessible_users.extend(users)

            db.session.add(post)
            db.session.commit()

            if status == 'published':
                post_html = render_template('community/_post_card.html', post=post)
                socketio.emit('new_post', {'html': post_html, 'post_id': post.id})

            message = '投稿を下書きに保存しました。' if status == 'draft' else '新しい投稿を作成しました！'
            return jsonify({'success': True, 'message': message})
        else:
            return jsonify({'success': False, 'message': '入力内容にエラーがあります。', 'errors': form.errors}), 400

    return render_template('community/_new_post_modal.html', form=form, is_edit_mode=False, post=None)


@community.route('/drafts')
@login_required
def drafts():
    """ユーザーの下書き一覧を表示するページ。"""
    user_drafts = Post.query.filter_by(author=current_user, status='draft').order_by(Post.created_at.desc()).all()
    return render_template('community/drafts.html', posts=user_drafts, title="下書き一覧")


@community.route('/post/<int:post_id>/edit', methods=['GET', 'POST'])
@login_required
@limiter.limit('10 per minute')
def edit_post(post_id):
    """投稿を編集する (モーダル対応)"""
    post = Post.query.get_or_404(post_id)
    if post.author != current_user and not current_user.is_admin:
        abort(403)

    form = PostForm(obj=post)
    form.categories.choices = [(c.id, c.name) for c in Category.query.filter_by(type='post').order_by('id').all()]

    if request.method == 'POST':
        if form.validate_on_submit():
            if post.content != form.content.data:
                history_record = EditHistory(
                    content=post.content,
                    editable_id=post.id,
                    editable_type='Post'
                )
                db.session.add(history_record)

            post.content = form.content.data
            post.comment_permission = ','.join(form.comment_permission.data)
            post.visibility = form.visibility.data
            post.is_adult = form.is_adult.data
            post.is_anonymous = form.is_anonymous.data
            post.status = 'draft' if 'submit_draft' in request.form else 'published'

            if form.media_file.data:
                try:
                    if post.media_filename:
                        old_media_path = os.path.join(current_app.config['UPLOAD_FOLDER'], post.media_filename)
                        if os.path.exists(old_media_path):
                            os.remove(old_media_path)
                    
                    post.media_filename = save_picture(form.media_file.data, output_folder='community_uploads')
                    ext = post.media_filename.rsplit('.', 1)[1].lower()
                    post.media_type = 'image' if ext in ['png', 'jpg', 'jpeg', 'gif', 'webp'] else 'other'
                except ValueError as e:
                    return jsonify({'success': False, 'message': str(e)}), 400

            post.categories = Category.query.filter(Category.id.in_(form.categories.data)).all()
            
            # --- ▼▼▼ ここからがタグの修正点です ▼▼▼ ---
            post.tags.clear()
            if form.tags.data:
                # フォームクラスに定義したclean_tagsメソッドで、#を除去したタグリストを取得
                cleaned_tags = form.clean_tags(form.tags.data)
                for tag_name in cleaned_tags:
                    # DBには#無しのタグ名を保存
                    tag = Tag.query.filter_by(name=tag_name).first() or Tag(name=tag_name)
                    post.tags.append(tag)
            # --- ▲▲▲ ここまでがタグの修正点です ▲▲▲ ---
            
            post.accessible_users = []
            if form.visibility.data == 'private' and form.accessible_users.data:
                usernames = [uname.strip() for uname in form.accessible_users.data.split(',') if uname.strip()]
                users = User.query.filter(User.username.in_(usernames)).all()
                post.accessible_users.extend(users)

            db.session.commit()
            
            if post.status == 'published':
                post_html = render_template('community/_post_card.html', post=post)
                socketio.emit('update_post', {'html': post_html, 'post_id': post.id})
            
            message = '下書きを更新しました。' if post.status == 'draft' else '投稿を更新しました。'
            return jsonify({'success': True, 'message': message})
        else:
            return jsonify({'success': False, 'message': '入力内容にエラーがあります。', 'errors': form.errors}), 400

    # GETリクエストの場合、DBのデータをフォームに設定
    form.comment_permission.data = post.comment_permission.split(',') if post.comment_permission else []
    form.categories.data = [c.id for c in post.categories]
    # 編集フォームには#を付けて表示するが、保存時に除去されるので問題ない
    form.tags.data = ' '.join([f"#{tag.name}" for tag in post.tags])
    if post.visibility == 'private':
         form.accessible_users.data = ', '.join([u.username for u in post.accessible_users])

    return render_template('community/_new_post_modal.html', form=form, post=post, is_edit_mode=True)


@community.route('/post/<int:post_id>/delete', methods=['POST'])
@login_required
def delete_post(post_id):
    """投稿を削除する"""
    post = Post.query.get_or_404(post_id)
    if post.author != current_user and not current_user.is_admin:
        abort(403)
        
    deleted_post_id = post.id
    
    if post.media_filename:
        media_path = os.path.join(current_app.config['UPLOAD_FOLDER'], post.media_filename)
        if os.path.exists(media_path):
            os.remove(media_path)

    db.session.delete(post)
    db.session.commit()
    
    socketio.emit('delete_post', {'post_id': deleted_post_id})
    
    flash('投稿を削除しました。', 'success')
    return redirect(url_for('community.board_index'))


@community.route('/post/<int:post_id>/history')
@login_required
def post_history(post_id):
    """投稿と関連コメントの編集履歴をHTMLの一部として返す"""
    post = Post.query.get_or_404(post_id)
    
    post_histories = EditHistory.query.filter_by(
        editable_id=post.id, 
        editable_type='Post'
    ).order_by(EditHistory.edited_at.desc()).all()
    
    comment_histories = EditHistory.query.join(Comment, (EditHistory.editable_id == Comment.id) & (EditHistory.editable_type == 'Comment'))\
        .filter(Comment.post_id == post.id)\
        .order_by(EditHistory.edited_at.desc())\
        .all()
        
    all_histories = sorted(post_histories + comment_histories, key=lambda h: h.edited_at, reverse=True)

    return render_template('community/_history_modal_content.html', histories=all_histories, post=post)