from .db import (
    load_table,
    save_table,
    users_table,
    posts_table,
    comments_table,
    messages_table,
    reports_table,
    jobs_table,
    groups_table,
    group_messages_table,
    fan_posts_table,
    appeals_table,
    materials_table,
    polls_table,
)


def load_users():
    return load_table(users_table)


def save_users(users):
    save_table(users_table, users, "user_id")


def load_posts():
    return load_table(posts_table)


def save_posts(posts):
    save_table(posts_table, posts, "id")


def load_comments():
    return load_table(comments_table)


def save_comments(comments):
    save_table(comments_table, comments, "id")


def load_messages():
    return load_table(messages_table)


def save_messages(messages):
    save_table(messages_table, messages, "id")


def load_reports():
    return load_table(reports_table)


def save_reports(reports):
    save_table(reports_table, reports, "id")


def load_jobs():
    return load_table(jobs_table)


def save_jobs(jobs):
    save_table(jobs_table, jobs, "id")


def load_groups():
    return load_table(groups_table)


def save_groups(groups):
    save_table(groups_table, groups, "id")


def load_group_messages():
    return load_table(group_messages_table)


def save_group_messages(messages):
    save_table(group_messages_table, messages, "id")


def load_fan_posts():
    return load_table(fan_posts_table)


def save_fan_posts(posts):
    save_table(fan_posts_table, posts, "id")


def load_appeals():
    return load_table(appeals_table)


def save_appeals(appeals):
    save_table(appeals_table, appeals, "id")


def load_materials():
    return load_table(materials_table)


def save_materials(materials):
    save_table(materials_table, materials, "id")


def load_polls():
    return load_table(polls_table)


def save_polls(polls):
    save_table(polls_table, polls, "id")
