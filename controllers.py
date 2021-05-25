"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email, get_user

url_signer = URLSigner(session)

#@action('index')
#@action.uses(db, auth, 'index.html')
#def index():
#    return dict(
#        # COMPLETE: return here any signed URLs you need.
#        my_callback_url = URL('my_callback', signer=url_signer),
#    )

@action('index')
@action.uses(db, auth, 'index.html')
def index():
    _user = get_user()
    rows = db(db.brawl.num_of_public != 0).select(db.brawl.ALL, orderby=~db.brawl.num_of_public, limitby=(0, 10)).as_list()
    counter = 0
    for row in rows:
        counter = counter + 1
        row["count"] = counter
        items = db(db.item.brawl_id == row["id"]).select(db.item.ALL, orderby=~db.item.num_of_wins)
        wins_list = []
        name_list = []
        for _item in items:
            wins_list.append(_item.num_of_wins)
            name_list.append((db.item_name[_item.item_name_id]).item_str)
        row["_num_of_wins"] = wins_list
        row["_item_name"] = name_list
    return dict(
        rows=rows,
        _user=_user,
        search_url = URL('search', signer=url_signer)
        )
    
@action('search')
@action.uses()
def search():
    #qs = filter(None, re.split(';|"| \'|,|/|\\ |\s', q))
    
    rows = []
    
    q = request.params.get("q")
    qs = q.split()
    
    _query = False
    for word in qs:
        _query = _query | (db.item_name.item_str == word)
    item_names = db(_query).select()
    
    _query = False
    for _item_name in item_names:
        _query = _query | (db.item.item_name_id == _item_name.id)
        print(db(db.item.item_name_id == _item_name.id).count())
    
    if _query:
        items = db(_query).select()
        
        _query = False
        for _item in items:
            _query = _query | (db.brawl.id == _item.brawl_id)
        _query = _query & (db.brawl.num_of_public != 0)

        if _query:
            rows = db(_query).select(db.brawl.ALL, orderby=~db.brawl.num_of_public, limitby=(0, 10)).as_list()
            count = 0
            for row in rows:
                items = db(db.item.brawl_id == row["id"]).select(db.item.ALL, orderby=~db.item.num_of_wins)
                wins_list = []
                name_list = []
                for _item in items:
                    wins_list.append(_item.num_of_wins)
                    name_list.append((db.item_name[_item.item_name_id]).item_str)
                row["_num_of_wins"] = wins_list
                row["_item_name"] = name_list
        
    return dict(results=rows)

@action('user')
@action.uses(db, session, auth.user, 'user.html')
def user():
    ok = True
    return dict(ok=ok)
    
    