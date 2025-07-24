# 業務自動化/app/community/views.py

from flask import render_template, redirect, url_for, flash, request, abort, jsonify
from flask_login import current_user, login_required
from app import db, socketio
from app.models import Post, Comment, Category, User, Notification, Tag # Tagをインポート
from app.community.forms import CommentForm
from app.forms import ReportForm, BirthdateForm
from app.utils.notifications import process_mentions
from . import community
from .decorators import age_verified, check_banned, check_initial_setup_and_profile, calculate_age
import logging

@community.route('/verify_age', methods=['GET', 'POST'])
@login_required
def verify_age():
    if current_user.birthdate is not None:
        return redirect(url_for('community.board_index'))

    form = BirthdateForm()
    if form.validate_on_submit():
        current_user.birthdate = form.birthdate.data
        db.session.commit()
        flash('生年月日を登録しました。', 'success')
        next_page = request.args.get('next')
        return redirect(next_page or url_for('community.board_index'))

    return render_template('community/verify_age.html', title='生年月日の登録', form=form)


@community.route('/')
@age_verified
def board_index():
    """
    掲示板のメインページ。
    パフォーマンス最適化のため、N+1問題を回避するクエリを使用。
    """
    page = request.args.get('page', 1, type=int)
    q = request.args.get('q', '')
    category_id = request.args.get('category', type=int)
    feed = request.args.get('feed', 'all')
    tag_name = request.args.get('tag', None)
    mode = request.args.get('mode', 'normal')
    anonymous_only = (mode == 'anonymous')

    role_filter = None
    if feed in ['vtuber', 'fan', 'creator']:
        role_filter = feed

    posts = Post.get_posts_for_board(
        feed_type=feed,
        q=q,
        role_filter=role_filter,
        category_id=category_id,
        page=page,
        tag_name=tag_name,
        anonymous_only=anonymous_only
    )

    post_categories = Category.query.filter_by(type='post').filter(Category.name != 'お知らせ').order_by(Category.name).all()

    # ▼▼▼ ログインユーザーのお気に入りタグを取得する処理を追記 ▼▼▼
    favorited_tags = []
    if current_user.is_authenticated:
        favorited_tags = current_user.favorited_tags.order_by(Tag.name).all()
    # ▲▲▲ ここまで追記 ▲▲▲

    return render_template('community/board_index.html',
                           title='掲示板',
                           posts=posts,
                           categories=post_categories,
                           search_query=q,
                           selected_category=category_id,
                           current_feed=feed,
                           selected_tag=tag_name,
                           current_mode=mode,
                           favorited_tags=favorited_tags) # テンプレートに渡す


@community.route('/post/<int:post_id>', methods=['GET', 'POST'])
@age_verified
@check_banned
def post_detail(post_id):
    post = Post.query.get_or_404(post_id)
    if post.visibility == 'private' and (not current_user.is_authenticated or (current_user != post.author and current_user not in post.accessible_users)):
        abort(403)
    if current_user.is_authenticated and (current_user.is_blocking(post.author) or post.author.is_blocking(current_user)):
        abort(403)

    form = CommentForm()
    report_form = ReportForm()

    if request.method == 'POST' and form.validate_on_submit():
        allowed_roles = post.get_allowed_comment_roles()
        can_comment = current_user.role in allowed_roles

        if not can_comment:
             return jsonify({'success': False, 'message': 'この投稿にコメントする権限がありません。'}), 403

        if current_user.is_banned:
            return jsonify({'success': False, 'message': 'あなたのアカウントは、コミュニティ機能の利用が制限されています。'}), 403
        if calculate_age(current_user.birthdate) < 14:
            return jsonify({'success': False, 'message': '14歳未満の方はコメントを投稿できません。'}), 403

        comment = Comment(
            content=form.content.data,
            author=current_user,
            post=post,
            parent_id=form.parent_id.data or None
        )
        db.session.add(comment)
        db.session.commit()

        if post.author != current_user:
            notification = post.author.add_notification(
                'new_comment',
                {'commenter_username': current_user.username, 'post_id': post.id, 'post_content': post.content[:30]}
            )
            if notification:
                db.session.add(notification)
                db.session.commit()
                socketio.emit('new_notification',
                            {
                                'name': 'new_comment',
                                'data': notification.get_data()
                            },
                            to=post.author.id)

        process_mentions(comment.content, post, current_user)

        socketio.emit('new_comment', {
            'post_id': post.id,
            'comment_count': len(post.comments),
            'html': render_template('community/_comment.html', comment=comment)
        })

        return jsonify({'success': True, 'message': 'コメントを投稿しました。'})

    if request.method == 'POST' and form.errors:
        return jsonify({'success': False, 'message': '入力内容にエラーがあります。', 'errors': form.errors}), 400

    comments = Comment.query.filter_by(post_id=post.id, parent_id=None).order_by(Comment.created_at.asc()).all()

    return render_template(
        'community/post_detail.html',
        title="投稿詳細",
        post=post,
        comments=comments,
        comment_form=form,
        report_form=report_form
    )