"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None
    
def get_user():
    return auth.current_user.get('id') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()

db.define_table(
    'brawl',
    Field('upvotes', 'integer', default=0),
    Field('comments', 'integer', default=0),
    Field('num_of_public', 'integer', default=0),
    Field('num_of_plays', 'integer', default=1),
)

db.define_table(
    'item_name',
    Field('item_str', requires=IS_NOT_EMPTY()),
    Field('num_of_uses', 'integer', default=0),
)

db.define_table(
    'item',
    Field('item_name_id', 'reference item_name'),
    Field('num_of_wins', 'integer', default=0),
    Field('brawl_id', 'reference brawl'),
)

db.define_table(
    'user_brawl',
    Field('brawl_id', 'reference brawl'),
    Field('first_item', 'integer'),
    Field('placement_list'),
    Field('created_by', default=get_user_email),
    Field('creation_date', 'datetime', default=get_time),
    Field('public', 'boolean', default=False),
)

db.define_table(
    'upvote',
    Field('brawl_id', 'reference brawl'),
    Field('up', 'boolean', default=False),
    Field('down', 'boolean', default=False),
    Field('created_by', default=get_user_email),
)

db.define_table(
    'comment',
    Field('brawl_id', 'reference brawl'),
    Field('bcomment'),
    Field('comment_user'),
    Field('upvotes', 'integer', default=0),
    Field('created_by', default=get_user_email),
    Field('creation_date', 'datetime', default=get_time),
)

db.define_table(
    'comment_upvote',
    Field('comment_id', 'reference comment'),
    Field('up', 'boolean', default=False),
    Field('down', 'boolean', default=False),
    Field('created_by', default=get_user_email),
)

db.commit()
