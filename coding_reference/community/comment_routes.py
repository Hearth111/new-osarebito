from flask import redirect, url_for, flash, request, abort, render_template
from flask_login import current_user, login_required
from app import db
from app.models import Comment, EditHistory
from . import community
from .decorators import age_verified, check_banned


@community.route('/comment/<int:comment_id>/edit', methods=['GET', 'POST'])
@login_required
@age_verified
@check_banned
def edit_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    if comment.author != current_user and not current_user.is_admin:
        abort(403)

    if request.method == 'POST':
        new_content = request.form.get('content')

        # 内容に変更があった場合のみ履歴を保存
        if comment.content != new_content:
            history_record = EditHistory(
                content=comment.content,    # 古い内容を保存
                editable_id=comment.id,     # どのコメントの履歴か
                editable_type='Comment'     # モデル名を記録
            )
            db.session.add(history_record)
            
        comment.content = new_content
        db.session.commit()
        flash('コメントを更新しました。', 'success')
        return redirect(url_for('community.post_detail', post_id=comment.post_id, _anchor=f'comment-{comment.id}'))
        
    return render_template('community/edit_comment.html', title='コメントの編集', comment=comment)


@community.route('/comment/<int:comment_id>/delete', methods=['POST'])
@login_required
@age_verified
@check_banned
def delete_comment(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    post_id = comment.post_id
    if comment.author != current_user and not current_user.is_admin:
        abort(403)
        
    db.session.delete(comment)
    db.session.commit()
    flash('コメントを削除しました。', 'success')
    return redirect(url_for('community.post_detail', post_id=post_id))

@community.route('/comment/<int:comment_id>/best_answer', methods=['POST'])
@login_required
def mark_as_best_answer(comment_id):
    comment = Comment.query.get_or_404(comment_id)
    post = comment.post

    if post.author != current_user and not current_user.is_admin:
        abort(403)
    
    # この投稿の他のベストアンサーを全て解除
    Comment.query.filter_by(post_id=post.id, is_best_answer=True).update({'is_best_answer': False})
    
    # 新しいベストアンサーを設定
    comment.is_best_answer = True
    db.session.commit()

    flash(f'{comment.author.username}さんのコメントをベストアンサーに設定しました。', 'success')
    return redirect(url_for('community.post_detail', post_id=post.id, _anchor=f'comment-{comment.id}'))