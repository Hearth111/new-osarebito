from flask import redirect, url_for, flash
from flask_login import current_user, login_required
from app import db
from app.models import Poll, PollChoice, PollVote
from . import community
from .decorators import age_verified, check_banned

@community.route('/vote/<int:option_id>', methods=['POST'])
@login_required
@age_verified
@check_banned
def vote(option_id):
    option = PollOption.query.get_or_404(option_id)
    poll = option.poll
    
    existing_vote = Vote.query.join(PollOption).filter(
        PollOption.poll_id == poll.id, 
        Vote.user_id == current_user.id
    ).first()
    
    if existing_vote:
        flash('この投票には既に投票済みです。', 'warning')
        return redirect(url_for('community.post_detail', post_id=poll.post_id))

    new_vote = Vote(user_id=current_user.id, option_id=option_id)
    db.session.add(new_vote)
    db.session.commit()
    flash(f'「{option.text}」に投票しました。', 'success')
    return redirect(url_for('community.post_detail', post_id=poll.post_id))