// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};


// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {

    // This is the Vue data.
    app.data = {
        // Complete as you see fit.
        query: "",
        publix: false,
        brawl_mode: true,
        players: [],
        results: [],
    };

    app.enumerate = (a) => {
        // This adds an _idx field to each element of the array.
        let k = 0;
        a.map((e) => {e._idx = k++;});
        return a;
    };
    
    app.search = function () {
        if (app.vue.query.length > 0) {
            axios.get(search_url, {params: {q: app.vue.query}})
                .then(function (result) {
                    app.vue.results = result.data.results;
                });
        } else {
            app.vue.results = []
        }
        
    };
    
    app.submit = function () {
        if(app.vue.players[1] !== ""){
            axios.post(submit_url,
            {
                players: app.vue.players,
                publix: app.vue.publix,
            }).then(function (response) {
                app.vue.players = response.data.players;
                app.vue.publix = false;
            });
        }
    };
    
    app.set_publix_mode = function () {
        app.vue.publix = !app.vue.publix;
    };
    
    app.set_brawl_mode = function () {
        app.vue.brawl_mode = !app.vue.brawl_mode;
        if(app.vue.brawl_mode){
            app.vue.clear_players();
        }
        // else{
        //     app.vue.submit();
        // }
    };
    
    app.clear_players = function () {
        for(i = 0; i < app.vue.players.length; i++){
            app.vue.players[i] = "";
        }
    };

    // This contains all the methods.
    app.methods = {
        // Complete as you see fit.
        search: app.search,
        submit: app.submit,
        set_publix_mode: app.set_publix_mode,
        set_brawl_mode: app.set_brawl_mode,
        clear_players: app.clear_players,
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
