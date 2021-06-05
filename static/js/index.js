// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {

    // This is the Vue data.
    app.data = {
        // Complete as you see fit.
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
        } else {
            app.vue.results = [];
        }
        
    };
    
    app.submit = function () {
        if(app.vue.players[1] !== ""){
            player_strs = [];
            for(i = 0; i < app.vue.players.length; i++){
                player_strs.push(app.vue.players[i].str);
            }
            axios.post(submit_url,
            {
                players: player_strs,
                publix: app.vue.publix,
            }).then(function (response) {
                new_players = [];
                for(i = 0; i < response.data.players.length; i++){
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
    
    app.set_brawl_mode = function () {
        app.vue.brawl_mode = !app.vue.brawl_mode;
    };
    
    app.clear_players = function () {
        for(i = 0; i < 8; i++){
            if(i < app.vue.players.length){
                app.vue.players[i].str = "";
            }else{
                app.vue.players.push({'id': i, 'str': ""});
            }
        }
    };
    
    app.copy_brawl = function (index, b_data) {
        if(b_data === 0){
            brawl = app.vue.brawls[index];
        }else{
            brawl = app.vue.results[index];
        }
        for(i = 0; i < app.vue.players.length; i++){
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

    // This contains all the methods.
    app.methods = {
        // Complete as you see fit.
        search: app.search,
        submit: app.submit,
        set_publix_mode: app.set_publix_mode,
        set_brawl_mode: app.set_brawl_mode,
        clear_players: app.clear_players,
        copy_brawl: app.copy_brawl,
        get_updated_brawls: app.get_updated_brawls,
        slow_show: app.slow_show,
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
