from flask import jsonify, request
from flask_login import current_user

from app.models import Post
from . import community

@community.route('/api/posts')
def posts_list():
    page = request.args.get('page', 1, type=int)
    posts = Post.get_posts_for_board(
        feed_type='all',
        q=None,
        role_filter=None,
        category_id=None,
        page=page
    )

    data = []
    for post in posts.items:
        data.append({
            'id': post.id,
            'content': post.content,
            'author': post.author.username if not post.is_anonymous else '匿名',
            'likes_count': post.likes.count() if hasattr(post, 'likes') else 0,
            'liked': current_user.is_authenticated and post.is_liked_by(current_user) if hasattr(post, 'is_liked_by') else False,
            'bookmarked': current_user.is_authenticated and post.is_bookmarked_by(current_user) if hasattr(post, 'is_bookmarked_by') else False,
            'created_at': post.created_at.isoformat()
        })

    return jsonify({
        'posts': data,
        'has_next': posts.has_next,
        'next_num': posts.next_num
    })
