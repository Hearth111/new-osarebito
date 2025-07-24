# /app/community/forms.py

from flask_wtf import FlaskForm
from wtforms import (
    StringField, SubmitField, TextAreaField, SelectMultipleField, 
    BooleanField, RadioField, FileField, HiddenField
)
from wtforms.validators import DataRequired, Length, Optional
from wtforms.widgets import ListWidget, CheckboxInput
# ▼▼▼ ファイルアップロード用のバリデーターをインポート ▼▼▼
from flask_wtf.file import FileRequired, FileAllowed
import re


class CommentForm(FlaskForm):
    """
    コメント投稿用のフォーム。返信機能のため、親コメントのIDを保持する隠しフィールドを含む。
    """
    content = TextAreaField('コメント', validators=[DataRequired(message="コメント内容を入力してください。"), Length(min=1, max=1000)])
    parent_id = HiddenField() # 返信先のコメントIDを格納
    submit = SubmitField('送信')


class PostForm(FlaskForm):
    """
    コミュニティ投稿の新規作成・編集フォーム
    """
    content = TextAreaField(
        '本文',
        validators=[DataRequired(message="本文は必須入力です。"), Length(max=2000)]
    )
    media_file = FileField('メディアファイル', validators=[Optional()])
    
    categories = SelectMultipleField(
        'カテゴリ',
        coerce=int,
        widget=ListWidget(prefix_label=False),
        option_widget=CheckboxInput()
    )
    
    tags = StringField('タグ')

    def clean_tags(self, tags_string):
        """
        入力されたタグ文字列を整形する。
        - カンマやスペースで区切られたタグを個別に処理
        - 各タグの先頭と末尾の空白を削除
        - 各タグの先頭にある '#' を削除
        - 空になったタグは無視する
        """
        if not tags_string:
            return []
        
        processed_string = re.sub(r'[\s,、]+', ',', tags_string)
        tags_list = [tag.strip() for tag in processed_string.split(',') if tag.strip()]

        cleaned_tags = []
        for tag in tags_list:
            if tag.startswith('#'):
                tag = tag[1:]
            
            if tag:
                cleaned_tags.append(tag)
        
        return cleaned_tags

    visibility = RadioField(
        '公開範囲',
        choices=[
            ('public', '全体に公開'),
            ('followers', 'フォロワーにのみ公開'),
            ('private', '指定したユーザーにのみ公開')
        ],
        default='public',
        validators=[DataRequired()]
    )
    accessible_users = StringField('閲覧を許可するユーザー')

    comment_permission = SelectMultipleField(
        'コメント許可',
        choices=[
            ('vtuber', '推され人'),
            ('fan', '推す人'),
            ('creator', 'お仕事人')
        ],
        default=['vtuber', 'fan', 'creator'], # デフォルトで全員に許可
        validators=[DataRequired(message="コメント許可範囲を1つ以上選択してください。")],
        widget=ListWidget(prefix_label=False),
        option_widget=CheckboxInput()
    )

    is_anonymous = BooleanField('匿名で投稿する', default=False)
    is_adult = BooleanField('成人向けコンテンツ', default=False)
    
    submit_publish = SubmitField('公開する')
    submit_draft = SubmitField('下書き保存')


class MuteWordForm(FlaskForm):
    """ミュートワード追加用フォーム"""
    word = StringField('ミュートする単語', validators=[DataRequired(), Length(min=1, max=50)])
    submit = SubmitField('追加')


class NotificationSettingsForm(FlaskForm):
    """通知設定用フォーム"""
    like_notification = BooleanField('自分の投稿への「いいね」')
    comment_notification = BooleanField('自分の投稿への「コメント」')
    mention_notification = BooleanField('自分への「メンション」')
    follow_notification = BooleanField('「フォロー」された時')
    dm_notification = BooleanField('ダイレクトメッセージ')
    submit = SubmitField('設定を保存')


class EyeCatchUploadForm(FlaskForm):
    """アイキャッチ画像アップロード用フォーム"""
    image = FileField('アイキャッチ画像を選択', validators=[
        FileRequired(),
        FileAllowed(['jpg', 'jpeg', 'png'], 'JPEGまたはPNG画像のみアップロードできます。')
    ])
    submit = SubmitField('アップロード')

class FavoriteTagForm(FlaskForm):
    """お気に入りタグ追加用フォーム"""
    tag_name = StringField('タグ名', validators=[DataRequired(), Length(min=1, max=50)])
    submit = SubmitField('追加')