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
        publix: false,
        players: [],
        results: [],
    };

    app.enumerate = (a) => {
        // This adds an _idx field to each element of the array.
        let k = 0;
        a.map((e) => {e._idx = k++;});
        return a;
    };
    
    app.submit = function () {
        if(app.vue.players[1] !== ""){
            axios.post(submit_url,
            {
                players: app.vue.players,
                publix: app.vue.publix,
            }).then(function (response) {
                app.clear_players();
                app.vue.publix = false;
                app.vue.results.unshift({
                    id: response.data.user_brawl_id,
                    public: response.data.publix,
                    names: (response.data.players).slice(),
                    showings: false,
                    });
                if(app.vue.results.length > 0){
                    new_result_id = (app.vue.results)[0].id;
                }
                for(i = 1; i < app.vue.results.length; i++){
                    if((app.vue.results)[i].id == new_result_id){
                        (app.vue.results).splice(i,1);
                    }
                }
                app.enumerate(app.vue.results);
                app.slow_show(app.vue.results[0]);
            });
        }
    };
    
    app.set_publix_mode = function () {
        app.vue.publix = !app.vue.publix;
    };
    
    app.set_public_mode = function (index) {
        if(app.vue.results[index].public) {
            app.set_public(index, false);
        }
        else{
            app.set_public(index, true);
        }
        app.vue.results[index].public = !(app.vue.results[index].public);
    };
    
    app.clear_players = function () {
        for(i = 0; i < app.vue.players.length; i++){
            app.vue.players[i] = "";
        }
    };
    
    app.rematch = function (index) {
        //app.set_public(index, false); always increases or decreases without logic
        axios.post(rematch_url,
            {
                element: app.vue.results[index]
            }).then( function (response) {
                app.vue.results[index].names = response.data.players;
                app.vue.results[index].showings = false;
                app.slow_show(app.vue.results[index]);
            });
            
    };
    
    app.set_public = function (index, mode) {
        axios.post(set_public_url,
            {
                element: app.vue.results[index],
                mode: mode,
            });
    };
    
    app._delete = function (index) {
        let id = app.vue.results[index].id;
        axios.post(_delete_url,
            {
                element: app.vue.results[index]
            }).then(function () {
                for (let i = 0; i < app.vue.results.length; i++) {
                    if (app.vue.results[i].id == id) {
                        app.vue.results.splice(i, 1);
                        app.enumerate(app.vue.results);
                        break;
                    }
                }
            });
    };
    
    app.load_new_user_brawls = function (page) {
        app.vue.results_page = app.vue.results_page + page;
        axios.get(load_user_brawls_url, {params: {p: app.vue.results_page}})
            .then((result) => {
                let results = result.data.results;
                app.enumerate(results);
                app.vue.results = results;
                if(page !== 0){
                    window.scrollTo(0,0);
                }
                });
    };
    
    app.slow_show = function (result) {
        setTimeout(() => result.showings = true, 600);
    };

    // This contains all the methods.
    app.methods = {
        // Complete as you see fit.
        submit: app.submit,
        set_publix_mode: app.set_publix_mode,
        set_public_mode: app.set_public_mode,
        clear_players: app.clear_players,
        rematch: app.rematch,
        set_public: app.set_public,
        _delete: app._delete,
        load_new_user_brawls: app.load_new_user_brawls,
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
        axios.get(load_user_brawls_url, {params: {p: 0}})
            .then((result) => {
                let results = result.data.results;
                app.enumerate(results);
                app.vue.results = results;
                });
        for(i = 0; i < 8; i++){
            app.vue.players.push("");
        }
    };

    // Call to the initializer.
    app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);