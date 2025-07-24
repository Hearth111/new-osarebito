from functools import wraps
from flask import flash, redirect, url_for, request
from flask_login import current_user
from datetime import date

def calculate_age(birthdate):
    if not birthdate:
        return None
    today = date.today()
    age = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
    return age

def age_verified(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            # ログインしていない場合はそのまま通す（各ビューで@login_requiredで制御）
            return f(*args, **kwargs)
        if current_user.birthdate is None:
            flash('コミュニティ機能を利用するには、生年月日の登録が必要です。', 'warning')
            return redirect(url_for('community.verify_age', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def check_banned(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if current_user.is_authenticated and current_user.is_banned:
            flash('あなたのアカウントは、コミュニティ機能の利用が制限されています。', 'danger')
            return redirect(url_for('main.top_page'))
        return f(*args, **kwargs)
    return decorated_function

def check_initial_setup_and_profile(f):
    """
    プロフィールが設定されているかを確認するデコレーター
    （実際のチェック内容はアプリケーションの仕様に合わせて調整してください）
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(current_user, 'profile') or not current_user.profile:
            flash('この機能を利用する前に、プロフィールの初期設定を行ってください。', 'info')
            return redirect(url_for('profile.edit_profile', next=request.url))
        return f(*args, **kwargs)
    return decorated_function