// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {

    // This is the Vue data.
    app.data = {
        // Complete as you see fit.
        user: false,
        user_email: "",
        results_page: 0,
        query: "",
        query_len: 0,
        publix: false,
        brawl_mode: true,
        showings: true,
        players: [],
        results: [],
        brawls: [],
    };

    app.enumerate = (a) => {
        // This adds an _idx field to each element of the array.
        let k = 0;
        a.map((e) => {e._idx = k++;});
        return a;
    };
    
    app.search = function (page) {
        if(app.vue.query_len !== app.vue.query.length){
            app.vue.query_len = app.vue.query.length;
            app.vue.results_page = 0;
        }
        app.vue.results_page = app.vue.results_page + page;
        if (app.vue.query.length > 0) {
            axios.get(search_url, {params: {q: app.vue.query, p: app.vue.results_page}})
                .then(function (result) {
                    app.vue.results = result.data.results;
                    if(page !== 0){
                        window.scrollTo(0,0);
                    }
                });
            if(app.vue.results.length == 1){
                for(let i = 0; i < app.vue.brawls.length; i++){
                    app.vue.brawls[i].comment_array = [];
                    app.vue.brawls[i].show_comments = false;
                }
            }
        } else {
            app.vue.results = [];
        }
        
    };
    
    app.submit = function () {
        if(app.vue.players[1] !== ""){
            player_strs = [];
            for(let i = 0; i < app.vue.players.length; i++){
                player_strs.push(app.vue.players[i].str);
            }
            axios.post(submit_url,
            {
                players: player_strs,
                publix: app.vue.publix,
            }).then(function (response) {
                new_players = [];
                for(let i = 0; i < response.data.players.length; i++){
                    new_players.push({'id': i, 'str': response.data.players[i]});
                }
                app.vue.players = new_players;
                app.vue.publix = false;
                app.set_brawl_mode();
                app.vue.showings = false;
                app.slow_show(response.data.brawl_id);
            });
        }
    };
    
    app.set_publix_mode = function () {
        app.vue.publix = !app.vue.publix;
    };
    
    app.show_comments = function (index, b_data) {
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        brawl.show_comments = !brawl.show_comments;
        brawl.load_more = 0;
    };
    
    app.show_comments_post = function (index, b_data) {
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        if(!brawl.show_comments){
            brawl.show_comments = true;
        }
    };
    
    app.get_comments = function (index, b_data) {
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        axios.get(get_comments_url, {params: {brawl_id: brawl.id, load_more: brawl.load_more}})
            .then(function (result) {
                brawl.comment_array = result.data.comments;
                brawl.comments = result.data.comments_count;
            });
    };
    
    app.get_comments_before_post = function (index, b_data) {
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        axios.get(get_comments_url, {params: {brawl_id: brawl.id, load_more: brawl.load_more}})
            .then(function (result) {
                brawl.comment_array = result.data.comments;
                brawl.comments = result.data.comments_count;
                app.post_comment(index, b_data);
            });
    };
    
    app.clear_comments = function (index, b_data) {
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        brawl.comment_array = [];
    };
    
    app.write_comment_mode = function (index, b_data, mode) {
        if(!app.vue.user){
            return;
        }
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        brawl.write_comment = mode;
    };
    
    app.empty_comment = function (index, b_data) {
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        brawl.comment = "";
    };
    
    app.delete_comment = function (index, c_index, b_data) {
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        _brawl_id = brawl.id;
        comment_id = brawl.comment_array[c_index].id;
        axios.post(delete_comment_url,
        {
            id: comment_id,
            brawl_id: _brawl_id
        }).then(function () {
            for (let i = 0; i < brawl.comment_array.length; i++) {
                if (brawl.comment_array[i].id == comment_id) {
                    brawl.comment_array.splice(i, 1);
                    break;
                }
            }
            brawl.comments = brawl.comments - 1;
        });
    };
    
    app.set_brawl_mode = function () {
        app.vue.brawl_mode = !app.vue.brawl_mode;
    };
    
    app.clear_players = function () {
        for(let i = 0; i < 8; i++){
            if(i < app.vue.players.length){
                app.vue.players[i].str = "";
            }else{
                app.vue.players.push({'id': i, 'str': ""});
            }
        }
    };
    
    app.copy_brawl = function (index, b_data) {
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        for(let i = 0; i < app.vue.players.length; i++){
            if(i < brawl._item_name.length){
                app.vue.players[i].str = brawl._item_name[i];
            }else{
                app.vue.players[i].str = "";
            }
        }
        if(!app.vue.brawl_mode){
            app.vue.brawl_mode = true;
        }
        window.scrollTo(0,0);
    };
    
    app.get_updated_brawls = function() {
        axios.get(load_brawls_url)
            .then((result) => {
                let brawls = result.data.brawls;
                app.enumerate(brawls);
                app.vue.brawls = brawls;
            });
            
        if (app.vue.query.length > 0) {
            axios.get(search_url, {params: {q: app.vue.query, p: app.vue.results_page}})
                .then(function (result) {
                    app.vue.results = result.data.results;
                });
        } else {
            app.vue.results = [];
        }
    };
    
    app.slow_show = function (brawl_id) {
        if(brawl_id > 0){
            setTimeout(() => app.get_updated_brawls(), 600);
        }
        setTimeout(() => app.vue.showings = true, 600);
    };
    
    app.post_comment = function (index, b_data) {
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        axios.post(post_comment_url,
        {
            comment: brawl.comment,
            brawl_id: brawl.id,
        }).then( function (response) {
            brawl.comment_array.unshift({
                id: response.data.comment_id,
                bcomment: brawl.comment,
                upvotes: 0,
                comment_user: response.data.name,
                created_by: app.vue.user_email,
                up: false,
                down: false
            });
            brawl.comments = brawl.comments + 1;
            app.empty_comment(index, b_data);
        });
    };
    
    app.upvote_comment = function (index, cindex, b_data) {
        if(!app.vue.user){
            return;
        }
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        
        comment = brawl.comment_array[cindex];
        
        let incre = 0;
        
        if(comment.down){
            comment.down = false;
            incre++;
        }
        if(comment.up){
            comment.up = false;
            incre--;
        }
        else{
            comment.up = true;
            incre++;
        }
        comment.upvotes += incre;
        axios.post(upvote_comment_url,
        {
            comment_id: comment.id,
            up: comment.up,
            down: comment.down,
            change: incre,
        });
    };
    
    app.downvote_comment = function (index, cindex, b_data) {
        if(!app.vue.user){
            return;
        }
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        
        comment = brawl.comment_array[cindex];
        
        let decre = 0;
        
        if(comment.up){
            comment.up = false;
            decre--;
        }
        if(comment.down){
            comment.down = false;
            decre++;
        }
        else{
            comment.down = true;
            decre--;
        }
        comment.upvotes += decre;
        axios.post(upvote_comment_url,
        {
            comment_id: comment.id,
            up: comment.up,
            down: comment.down,
            change: decre,
        });
    };
    
    app.upvote = function (index, b_data) {
        if(!app.vue.user){
            return;
        }
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        
        let incre = 0;
        
        if(brawl.down){
            brawl.down = false;
            incre++;
        }
        if(brawl.up){
            brawl.up = false;
            incre--;
        }
        else{
            brawl.up = true;
            incre++;
        }
        brawl.upvotes += incre;
        axios.post(upvote_brawl_url,
        {
            brawl_id: brawl.id,
            up: brawl.up,
            down: brawl.down,
            change: incre,
        }).then(function () {
            if(b_data !== 0){
                for(let i = 0; i < app.vue.brawls.length; i++){
                    if(app.vue.brawls[i].id === brawl.id){
                        let b_brawl = app.vue.brawls[i];
                        b_brawl.up = brawl.up;
                        b_brawl.down = brawl.down;
                        b_brawl.upvotes = brawl.upvotes;
                        break;
                    }
                }
            }
        });
    };
    
    app.downvote = function (index, b_data) {
        if(!app.vue.user){
            return;
        }
        let brawl = {};
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        
        let decre = 0;
        
        if(brawl.up){
            brawl.up = false;
            decre--;
        }
        if(brawl.down){
            brawl.down = false;
            decre++;
        }
        else{
            brawl.down = true;
            decre--;
        }
        brawl.upvotes += decre;
        axios.post(upvote_brawl_url,
        {
            brawl_id: brawl.id,
            up: brawl.up,
            down: brawl.down,
            change: decre,
        }).then(function () {
            if(b_data !== 0){
                for(let i = 0; i < app.vue.brawls.length; i++){
                    if(app.vue.brawls[i].id === brawl.id){
                        let b_brawl = app.vue.brawls[i];
                        b_brawl.up = brawl.up;
                        b_brawl.down = brawl.down;
                        b_brawl.upvotes = brawl.upvotes;
                        break;
                    }
                }
            }
        });
    };
    
    app.kFormatter = function(num) {
        return Math.abs(num) > 999 ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num)*Math.abs(num);
    };  // found this beauty @ https://stackoverflow.com/questions/9461621/format-a-number-as-2-5k-if-a-thousand-or-more-otherwise-900

    // This contains all the methods.
    app.methods = {
        // Complete as you see fit.
        search: app.search,
        submit: app.submit,
        set_publix_mode: app.set_publix_mode,
        show_comments: app.show_comments,
        write_comment_mode: app.write_comment_mode,
        empty_comment: app.empty_comment,
        set_brawl_mode: app.set_brawl_mode,
        clear_players: app.clear_players,
        copy_brawl: app.copy_brawl,
        get_updated_brawls: app.get_updated_brawls,
        slow_show: app.slow_show,
        post_comment: app.post_comment,
        upvote: app.upvote,
        downvote: app.downvote,
        get_comments: app.get_comments,
        clear_comments: app.clear_comments,
        show_comments_post: app.show_comments_post,
        delete_comment: app.delete_comment,
        upvote_comment: app.upvote_comment,
        downvote_comment: app.downvote_comment,
        get_comments_before_post: app.get_comments_before_post,
        kFormatter: app.kFormatter,
    };

    // This creates the Vue instance.
    app.vue = new Vue({
        el: "#vue-target",
        data: app.data,
        methods: app.methods
    });

    // And this initializes it.
    app.init = () => {
        // Put here any initialization code.
        // Typically this is a server GET call to load the data.
        axios.get(load_brawls_url)
            .then((result) => {
                let brawls = result.data.brawls;
                app.enumerate(brawls);
                app.vue.brawls = brawls;
                app.vue.user = result.data.has_user;
                app.vue.user_email = result.data.user_email;
            });
        
        for(i = 0; i < 8; i++){
            app.vue.players.push({'id': i, 'str': ""});
        }
    };

    // Call to the initializer.
    app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);
