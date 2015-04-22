// Load dependencies
var EventEmitter = require("events").EventEmitter,
    assign = require("object-assign");

// Load dispatcher
var AppDispatcher = require("../appDispatcher");

// Load constants
var UpdateConstants = require("../constants/update");

// Load models
var UpdateModel = require("../models/update");

// Constants
var CHANGE_EVENT = "change";

// Setup vars
var syncTimer = null,
    fetchInterval = 10000; // 10 seconds


// Define the Backbone collection (Initialized below)
var UpdatesCollection = Backbone.Collection.extend({

    model: UpdateModel,

    comparator: function (update1, update2) {
        return (new Date(update2.get("timestamp")) - new Date(update1.get("timestamp")));
    },

    initialize: function (options) {
        options = options || {};
        this.url = options.url || "/api/updates";
    }

});


// Create the initial collection
var updatesCollection = new UpdatesCollection();


// Define the store EventEmitter object
var UpdatesStore = assign({}, EventEmitter.prototype, {

    getAll: function () {
        return updatesCollection;
    },

    emitChange: function () {
        this.emit(CHANGE_EVENT);
    },

    addChangeListener: function (callback) {

        this.on(CHANGE_EVENT, callback);

        if (EventEmitter.listenerCount(this, CHANGE_EVENT) == 1) {
            startSync();
        }

    },

    removeChangeListener: function (callback) {
        this.removeListener(CHANGE_EVENT, callback);

        if (EventEmitter.listenerCount(this, CHANGE_EVENT) <= 0) {
            stopSync();
        }

    }

});


// Attach the event listener
updatesCollection.on("add change remove", UpdatesStore.emitChange.bind(UpdatesStore), UpdatesStore);


// Create a new update
var create = function (text) {

    var update = new UpdateModel({
        timestamp: (new Date()).toISOString(),
        text: text
    });

    updatesCollection.add(update);
    update.save();

};


// Destroy an existing update
var destroy = function (id) {
    var update = updatesCollection.get(id);
    update.destroy();
};


// Change URL of store (ie. Your updates, timeline, etc.)
var changeURL = function (url) {
    updatesCollection.set([]);
    updatesCollection.url = url;
};


// Begin syncing to the server
var startSync = function () {

    updatesCollection.fetch();

    syncTimer = setInterval(function () {
        updatesCollection.fetch();
    }, fetchInterval);

};


// Stop the sync
var stopSync = function () {
    clearInterval(syncTimer);
    syncTimer = null;
};



// Exports
module.exports = UpdatesStore;


// Register with the dispatcher to handle actions
AppDispatcher.register(function (action) {

    switch (action.actionType) {

        case UpdateConstants.UPDATE_CREATE:

            create(action.text);
            UpdatesStore.emitChange();
            break;

        case UpdateConstants.UPDATE_DESTROY:

            destroy(action.id);
            UpdatesStore.emitChange();
            break;

        case UpdateConstants.CHANGE_URL:

            changeURL(action.url);
            break;

        default:
        // Do nothing

    }

});