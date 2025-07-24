from flask import redirect, url_for, flash, request
from flask_login import current_user, login_required
from app import db
from app.models import Post, Comment, User, Report
from app.forms import ReportForm
from . import community
from .decorators import age_verified, check_banned

@community.route('/report', methods=['POST'])
@login_required
@age_verified
@check_banned
def report():
    form = ReportForm()
    if form.validate_on_submit():
        post_id = request.form.get('post_id', type=int)
        comment_id = request.form.get('comment_id', type=int)
        target_post = None
        reported_user = None
        
        if post_id:
            target_post = Post.query.get_or_404(post_id)
            reported_user = target_post.author
        elif comment_id:
            target_comment = Comment.query.get_or_404(comment_id)
            reported_user = target_comment.author
            target_post = target_comment.post
        
        if reported_user is None or reported_user == current_user:
            flash('無効な通報です。', 'danger')
            return redirect(request.referrer or url_for('community.board_index'))

        # --- ここからが省略されていたポイント加算ロジック ---
        existing_report_by_user = Report.query.filter_by(
            reporter_id=current_user.id, 
            reported_user_id=reported_user.id,
            post_id=post_id,
            comment_id=comment_id
        ).first()
        
        # 同じユーザーが同じ対象を複数回通報できないようにする
        if existing_report_by_user is None:
            points = 0
            # 役割に応じて加算するポイントを変更
            if current_user.role in ['creator', 'vtuber'] and reported_user.role == 'fan':
                points = 5
            elif current_user.role == 'fan' and reported_user.role in ['creator', 'vtuber']:
                points = 1
            else:
                points = 2
            
            # reported_user の danger_points を更新
            # User.danger_points はクラス属性のため、インスタンスの属性を直接操作する
            reported_user.danger_points = (reported_user.danger_points or 0) + points
            
            # --- オートBANのしきい値を15に変更 ---
            if reported_user.danger_points >= 15:
                reported_user.is_banned = True
        # --- ポイント加算ロジックここまで ---
        
        new_report = Report(
            reporter_id=current_user.id, 
            reported_user_id=reported_user.id,
            post_id=post_id, 
            comment_id=comment_id,
            reason=form.reason.data, 
            details=form.details.data
        )
        db.session.add(new_report)
        db.session.commit()
        flash('ご報告ありがとうございました。内容を確認し、対応いたします。', 'success')
    else:
        for field, errors in form.errors.items():
            for error in errors:
                flash(f'{error}', 'danger')

    if target_post:
        return redirect(url_for('community.post_detail', post_id=target_post.id))
    return redirect(url_for('community.board_index'))