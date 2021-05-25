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
    
    app.clear_players = function () {
        for(i = 0; i < app.vue.players.length; i++){
            app.vue.players.fill(""); //not using it for now because inputs 
        }                             //don't update after changed
    };
    
    app.set_publix_mode = function () {
        app.vue.publix = !app.vue.publix;
    };

    // This contains all the methods.
    app.methods = {
        // Complete as you see fit.
        search: app.search,
        set_publix_mode: app.set_publix_mode,
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
