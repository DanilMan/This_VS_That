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
from .models import get_user_email, get_user, get_time
import random

url_signer = URLSigner(session)

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
        load_brawls_url = URL('load_brawls', signer=url_signer),
        search_url = URL('search', signer=url_signer),
        submit_url = URL('submit', signer=url_signer),
        copy_brawl_url = URL('copy_brawl', signer=url_signer),
        upvote_brawl_url = URL('upvote_brawl', signer=url_signer),
        post_comment_url = URL('post_comment', signer=url_signer),
        get_comments_url = URL('get_comments', signer=url_signer),
        delete_comment_url = URL('delete_comment', signer=url_signer),
        upvote_comment_url = URL('upvote_comment', signer=url_signer),
        )

@action('load_brawls')
@action.uses(db, auth)
def load_brawls():
    has_user = True
    _user = get_user()
    _user_email = get_user_email()
    brawls = db(db.brawl.num_of_public != 0).select(db.brawl.ALL, orderby=~db.brawl.num_of_public | ~db.brawl.upvotes | ~db.brawl.comments, limitby=(0, 10)).as_list()
    counter = 0
    for brawl in brawls:
        counter = counter + 1
        brawl["count"] = counter
        items = db(db.item.brawl_id == brawl["id"]).select(db.item.ALL, orderby=~db.item.num_of_wins)
        wins_list = []
        name_list = []
        for _item in items:
            wins_list.append(_item.num_of_wins)
            name_list.append((db.item_name[_item.item_name_id]).item_str)
        brawl["_num_of_wins"] = wins_list
        brawl["_item_name"] = name_list
        brawl["comment"] = ""
        brawl["show_comments"] = False
        brawl["write_comment"] = False
        brawl["comment_array"] = []
        upvote = db((db.upvote.brawl_id == brawl["id"]) & (db.upvote.created_by == _user_email)).select().first()
        if upvote:
            brawl["up"] = upvote.up
            brawl["down"] = upvote.down
        else:
            brawl["up"] = False
            brawl["down"] = False
            
    if not _user:
        has_user = False
    return dict(brawls=brawls, has_user=has_user, user_email=_user_email)


@action('user')
@action.uses(db, auth, 'user.html')
def user():
    curr_user = get_user()
    if not curr_user:
        redirect(URL('index'))
    _user = db(db.auth_user.id == curr_user).select().first()
    user_name = _user.first_name.upper() + " " + _user.last_name.upper()
    return dict(
        curr_user=curr_user,
        user_name=user_name,
        submit_url = URL('submit', signer=url_signer),
        load_user_brawls_url = URL('load_user_brawls', signer=url_signer),
        rematch_url = URL('rematch', signer=url_signer),
        set_public_url = URL('set_public', signer=url_signer),
        _delete_url = URL('_delete', signer=url_signer),
        )

@action('load_user_brawls')
@action.uses(db, auth)
def load_user_brawls():
    page = int(request.params.get("p"))
    rows = db(db.user_brawl.created_by == get_user_email()).select(db.user_brawl.ALL, orderby=~db.user_brawl.creation_date, limitby=(page * 10, ((page * 10) + 11)))
    results = []
    for index, row in enumerate(rows):
        result = {}
        result["id"] = row.id
        result["public"] = row.public
        result["names"] = []
        result["showings"] = True
        for _index, _id in enumerate(row.placement_order_ids):
            item = db(db.item.id == _id).select().first()
            name = db(db.item_name.id == item.item_name_id).select().first()
            result["names"].append(name.item_str)
        results.append(result)
        
    return dict(
        results=results,
        )

@action('search')
@action.uses(db)
def search():
    _user_email = get_user_email()
    rows = []
    
    q = request.params.get("q")
    qs = [(i.strip()).lower() for i in q.split(",")]
    
    page = int(request.params.get("p"))
    
    _query = False
    for word in qs:
        _query = _query | (db.item_name.item_str == word)
    item_names = db(_query).select()
    
    _query = False
    for _item_name in item_names:
        _query = _query | (db.item.item_name_id == _item_name.id)
        #print(db(db.item.item_name_id == _item_name.id).count())
    
    if _query:
        items = db(_query).select()
        
        _query = False
        for _item in items:
            _query = _query | (db.brawl.id == _item.brawl_id)
        _query = _query & (db.brawl.num_of_public != 0)

        if _query:
            rows = db(_query).select(db.brawl.ALL, orderby=~db.brawl.num_of_public | ~db.brawl.upvotes, limitby=(page * 10, ((page * 10) + 11))).as_list()
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
                row["comment"] = ""
                row["show_comments"] = False
                row["write_comment"] = False
                row["comment_array"] = []
                upvote = db((db.upvote.brawl_id == row["id"]) & (db.upvote.created_by == _user_email)).select().first()
                if upvote:
                    row["up"] = upvote.up
                    row["down"] = upvote.down
                else:
                    row["up"] = False
                    row["down"] = False
        
    return dict(results=rows)

@action('submit', method="POST")
@action.uses(db, session, url_signer.verify())
def submit():
    players = request.json.get('players')
    players = list(filter(None, players))
    players = [(i.strip(", ")).lower() for i in players]
    #print(players)
    
    if(get_user()):
        publix = request.json.get('publix')
        pub = 0
        if publix:
            pub = 1
        player_name_ids = []
        for word in players:
            curr_item = db(db.item_name.item_str == word).select().first()
            #if curr_item:
            #    num = curr_item.num_of_uses + 1
            #else:
            #    num = 1
            item_id = db.item_name.update_or_insert((db.item_name.item_str == word), item_str=word) #, num_of_uses=num
            if not item_id:
                item_id = curr_item.id
            player_name_ids.append(item_id)
            
        _query = False
        for name_id in player_name_ids:
            _query = _query | (db.item.item_name_id == name_id)
        if _query:
            final_brawl_id = 0
            items = db(_query).select(db.item.ALL, orderby=db.item.brawl_id)
            if items:
                leng = len(players)
                #print(leng)
                counter = 1
                brawl_ids = []
                if leng > 0:
                    prev_brawl_id = items[0].brawl_id
                for item in items:
                    #print(item)
                    if prev_brawl_id != item.brawl_id:
                        counter = 1
                    if leng == counter:
                        brawl_ids.append(item.brawl_id)
                    prev_brawl_id = item.brawl_id
                    counter += 1
                for brawl_id in brawl_ids:
                    brawl = db(db.item.brawl_id == brawl_id).select()
                    #print(brawl_id)
                    if len(brawl) == len(players):
                        #print("brawl length: " + str(len(brawl)))
                        final_brawl_id = brawl_id
                        break
            
            #print("player_name_ids: " + str(player_name_ids))
            
            if final_brawl_id == 0:
                brawl_id = db.brawl.insert(
                    num_of_public = pub,
                    num_of_plays = 1,
                    )
                for player_name_id in player_name_ids:
                    db.item.insert(
                        item_name_id = player_name_id,
                        brawl_id = brawl_id,
                        )
            else:
                brawl_set = db(db.brawl.id == final_brawl_id)
                _brawl = brawl_set.select().first()
                brawl_set.update(
                    num_of_public = _brawl.num_of_public + pub,
                    num_of_plays = _brawl.num_of_plays + 1
                    )
                    
                #print("num_of_public: " + str(_brawl.num_of_public + pub))
                #print("num_of_plays: " + str(_brawl.num_of_plays + 1))
                
                brawl_id = final_brawl_id
            
            items = db(db.item.brawl_id == brawl_id).select().as_list()
            random.shuffle(items)
            players.clear()
            item_placement = []
            for index, item in enumerate(items):
                if index == 0:
                    db(db.item.id == item["id"]).update(
                        num_of_wins = item["num_of_wins"] + pub
                        )
                itemname = db(db.item_name.id == item["item_name_id"]).select().first()
                players.append(itemname.item_str)
                item_placement.append(item["id"])
            
            _user_brawl = 0
            
            if final_brawl_id == 0:
                for item in items:
                    item_name_check = db(db.item_name.id == item["item_name_id"])
                    itemname = item_name_check.select().first()
                    item_name_check.update(
                        num_of_uses = itemname.num_of_uses + 1
                        )
                
                _user_brawl = db.user_brawl.insert(
                    brawl_id = brawl_id,
                    placement_order_ids = item_placement,
                    public = publix
                )
            else:
                user_brawl_check = db((db.user_brawl.brawl_id == brawl_id) & (db.user_brawl.created_by == get_user_email()))
                _user_brawl = user_brawl_check.select().first()
                if _user_brawl:
                    if _user_brawl.public:
                        check_item_wins = db(db.item.id == _user_brawl.placement_order_ids[0])
                        item_for_wins = check_item_wins.select().first()
                        check_item_wins.update(
                            num_of_wins = item_for_wins.num_of_wins - 1
                            )
                    
                    brawl_set = db(db.brawl.id == final_brawl_id)
                    _brawl = brawl_set.select().first()
                    brawl_set.update(
                        num_of_public = _brawl.num_of_public - _user_brawl.public,
                        num_of_plays = _brawl.num_of_plays - 1
                        )
                    _user_brawl = _user_brawl.id
                    user_brawl_check.update(
                        placement_order_ids = item_placement,
                        public = publix,
                        creation_date = get_time()
                        )
                else:
                    _user_brawl = db.user_brawl.insert(
                        brawl_id = brawl_id,
                        placement_order_ids = item_placement,
                        public = publix
                    )
                    for item in items:
                        item_name_check = db(db.item_name.id == item["item_name_id"])
                        itemname = item_name_check.select().first()
                        item_name_check.update(
                            num_of_uses = itemname.num_of_uses + 1
                            )
                
                #item_set = db((db.item.id == items[0]["id"]))
                #_item = item_set.select().first()
                #item_set.update(
                #    num_of_wins = _item.num_of_wins + pub
                #    )
                
                #print("num_of_wins: " + str(_item.num_of_wins + pub))
    else:
        random.shuffle(players)
        _user_brawl = 0
        publix = False
        brawl_id = 0
    return dict(players=players, user_brawl_id=_user_brawl, publix=publix, brawl_id=brawl_id)

@action('rematch', method="POST")
@action.uses(db, session, url_signer.verify())
def rematch():
    element = request.json.get('element')
    
    user_brawl_check = db(db.user_brawl.id == element["id"])
    user_brawl = user_brawl_check.select().first()
    
    items = db(db.item.brawl_id == user_brawl.brawl_id).select().as_list()
    
    random.shuffle(items)
    
    players = []
    placement = []
    for item in items:
        item_name = db(db.item_name.id == item["item_name_id"]).select().first()
        players.append(item_name.item_str)
        placement.append(item["id"])
    
    if (element["public"]) and ((user_brawl.placement_order_ids)[0] != (items[0])["id"]):
        orig_item_check = db(db.item.id == (user_brawl.placement_order_ids)[0])
        orig_item = orig_item_check.select().first()
        
        orig_item_check.update(
            num_of_wins = orig_item.num_of_wins - 1
            )
        
        item_check = db(db.item.id == (items[0])["id"])
        item = item_check.select().first()
        
        item_check.update(
            num_of_wins = item.num_of_wins + 1
            )
    
    user_brawl_check.update(
        placement_order_ids = placement,
        public = element["public"]
        )
    return dict(players=players)

@action('set_public', method="POST")
@action.uses(db, session, url_signer.verify())
def set_public():
    element = request.json.get('element')
    mode = request.json.get('mode')
    if mode:
        arith = 1
    else:
        arith = -1
    
    user_brawl_check = db(db.user_brawl.id == element["id"])
    user_brawl = user_brawl_check.select().first()
    
    user_brawl_check.update(
        public = mode
        )
    
    brawl_check = db(db.brawl.id == user_brawl.brawl_id)
    brawl = brawl_check.select().first()
    
    brawl_check.update(
        num_of_public = brawl.num_of_public + arith
        )
    
    item_check = db(db.item.id == (user_brawl.placement_order_ids)[0])
    item = item_check.select().first()
    
    item_check.update(
        num_of_wins = item.num_of_wins + arith
        )
    return "ok"

@action('_delete', method="POST")
@action.uses(db, session, url_signer.verify())
def _delete():
    element = request.json.get('element')
    arith = int(element["public"])
    
    user_brawl_check = db(db.user_brawl.id == element["id"])
    user_brawl = user_brawl_check.select().first()
    
    brawl_check = db(db.brawl.id == user_brawl.brawl_id)
    brawl = brawl_check.select().first()
    
    items_check = db(db.item.brawl_id == brawl.id)
    items = items_check.select()
    
    for item in items:
        item_name_check = db(db.item_name.id == item.item_name_id)
        item_name = item_name_check.select().first()
        if item_name.num_of_uses > 1:
            item_name_check.update(
                num_of_uses = item_name.num_of_uses - 1
                )
        else:
            item_name_check.delete()
    
    if brawl.num_of_plays > 1:
        brawl_check.update(
            num_of_public = brawl.num_of_public - arith,
            num_of_plays = brawl.num_of_plays - 1
            )
        item_check = db(db.item.id == (user_brawl.placement_order_ids)[0])
        item = item_check.select().first()
        item_check.update(
            num_of_wins = item.num_of_wins - arith
            )
    else:
        brawl_check.delete()
    
    user_brawl_check.delete()
    
    return "ok"

@action('upvote_brawl', method="POST")
@action.uses(db, session, url_signer.verify())
def upvote_brawl():
    user_email = get_user_email()
    brawl_id = request.json.get('brawl_id')
    up = request.json.get('up')
    down = request.json.get('down')
    change = request.json.get('change')
    
    brawl_check = db(db.brawl.id == brawl_id)
    brawl = brawl_check.select().first()
    
    brawl_check.update(
        upvotes = brawl.upvotes + change
        )
    
    upvote_check = db((db.upvote.brawl_id == brawl_id) & (db.upvote.created_by == user_email))
    upvote = upvote_check.select().first()
    
    if upvote:
        upvote_check.update(
            up = up,
            down = down
            )
    else:
        db.upvote.insert(
            brawl_id = brawl.id,
            up = up,
            down = down
            )
    return "ok"

@action('upvote_comment', method="POST")
@action.uses(db, session, url_signer.verify())
def upvote_comment():
    user_email = get_user_email()
    comment_id = request.json.get('comment_id')
    up = request.json.get('up')
    down = request.json.get('down')
    change = request.json.get('change')
    
    comment_check = db(db.comment.id == comment_id)
    comment = comment_check.select().first()
    
    comment_check.update(
        upvotes = comment.upvotes + change
        )
    
    comment_upvote_check = db((db.comment_upvote.comment_id == comment.id) & (db.comment_upvote.created_by == user_email))
    comment_upvote = comment_upvote_check.select().first()
    
    if comment_upvote:
        comment_upvote_check.update(
            up = up,
            down = down
            )
    else:
        db.comment_upvote.insert(
            comment_id = comment.id,
            up = up,
            down = down
            )
    return "ok"

@action('post_comment', method="POST")
@action.uses(db, session, url_signer.verify())
def post_comment():
    comment = request.json.get('comment')
    brawl_id = request.json.get('brawl_id')
    
    brawl_check = db(db.brawl.id == brawl_id)
    brawl = brawl_check.select().first()
    
    user = db(db.auth_user.id == get_user()).select().first()
    name = user.first_name + " " + user.last_name
    
    brawl_check.update(
        comments = brawl.comments + 1
        )
    
    comment_id = db.comment.insert(
        brawl_id = brawl_id,
        bcomment = comment,
        comment_user = name,
        )
    
    return dict(comment_id=comment_id, name=name)

@action('get_comments')
@action.uses(db, session, url_signer.verify())
def get_comments():
    user_email = get_user_email()
    brawl_id = request.params.get("brawl_id")
    page = 0
    comments = db(db.comment.brawl_id == brawl_id).select(db.comment.ALL, orderby=~db.comment.creation_date | ~db.comment.upvotes, limitby=(page * 10, ((page * 10) + 11))).as_list()
    for comment in comments:
        upvote = db((db.comment_upvote.comment_id == comment["id"]) & (db.comment_upvote.created_by == user_email)).select().first()
        if upvote:
            comment["up"] = upvote.up
            comment["down"] = upvote.down
        else:
            comment["up"] = False
            comment["down"] = False
    return dict(comments=comments)

@action('delete_comment', method="POST")
@action.uses(db, session, url_signer.verify())
def delete_comment():
    comment_id = request.json.get('id')
    brawl_id = request.json.get('brawl_id')
    db(db.comment.id == comment_id).delete()
    brawl_check = db(db.brawl.id == brawl_id)
    brawl = brawl_check.select().first()
    brawl_check.update(
        comments = brawl.comments - 1
        )
    return "ok"



































