# app/community/settings_routes.py

from flask import render_template, flash, redirect, url_for, request
from flask_login import current_user, login_required
from app import db
from app.models import User, Tag
from .forms import MuteWordForm, NotificationSettingsForm, EyeCatchUploadForm, FavoriteTagForm
from . import community

@community.route('/settings', methods=['GET', 'POST'])
@login_required
def community_settings():
    # 各フォームをインスタンス化
    mute_word_form = MuteWordForm(prefix="mute")
    notification_form = NotificationSettingsForm(prefix="notify")
    eyecatch_form = EyeCatchUploadForm(prefix="eyecatch")
    favorite_tag_form = FavoriteTagForm(prefix="favtag")

    # ▼▼▼ フォーム送信の判定方法を修正 ▼▼▼
    if request.method == 'POST':
        if notification_form.submit.data and notification_form.validate():
            # このフォームの送信ボタンが押された場合の処理
            flash('通知設定を更新しました。', 'success')
            return redirect(url_for('community.community_settings'))

        if mute_word_form.submit.data and mute_word_form.validate():
            # このフォームの送信ボタンが押された場合の処理
            flash(f"「{mute_word_form.word.data}」をミュートワードに追加しました。", 'success')
            return redirect(url_for('community.community_settings'))

        if eyecatch_form.submit.data and eyecatch_form.validate():
            # このフォームの送信ボタンが押された場合の処理
            flash('アイキャッチ画像を更新しました。', 'success')
            return redirect(url_for('community.community_settings'))

        if favorite_tag_form.submit.data and favorite_tag_form.validate():
            # このフォームの送信ボタンが押された場合の処理
            tag_name = favorite_tag_form.tag_name.data.strip().lstrip('#')
            if tag_name:
                tag = Tag.query.filter_by(name=tag_name).first()
                if tag is None:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                
                current_user.favorite_tag(tag)
                db.session.commit()
                flash(f'タグ「#{tag.name}」をお気に入りに追加しました。', 'success')
            else:
                flash('タグ名を入力してください。', 'warning')
            return redirect(url_for('community.community_settings'))

    # GETリクエストの場合の処理...
        
    favorited_tags = current_user.favorited_tags.order_by(Tag.name).all()

    return render_template('community/settings.html',
                           title='コミュニティ設定',
                           mute_word_form=mute_word_form,
                           notification_form=notification_form,
                           eyecatch_form=eyecatch_form,
                           favorite_tag_form=favorite_tag_form,
                           favorited_tags=favorited_tags)