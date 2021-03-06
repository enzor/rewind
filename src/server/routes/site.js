"use strict";

// Intercept .jsx files to compile JSX
require("node-jsx").install({extension: ".jsx"});

// Include dependencies
var React = require("react"),
    express = require("express");

// Load React components (As factories)
var YourUpdatesComponent = React.createFactory(require("../../shared/components/yourUpdates.jsx")),
    HeaderComponent = React.createFactory(require("../../shared/components/header.jsx"));

// Load controllers
var UpdatesController = require("../controllers/updates"),
    updatesController = new UpdatesController();

// Load views
var updatesView = require("../views/updatesBackboneCollectionMock");

// Setup routes
var router = module.exports = express.Router();

router.get("/", function (req, res, next) {

    var startPoint = 0;

    updatesController.getRecentUpdates(startPoint).then(function (updates) {

        var renderedHeaderMarkup = React.renderToString(HeaderComponent());

        var renderedUpdateMarkup = React.renderToString(YourUpdatesComponent({
            url: "/api/updates",
            serverRenderedUpdates: updatesView({
                updates: updates
            })
        }));

        res.status(200).render("index", {
            serverRenderedHeaderComponent: renderedHeaderMarkup,
            serverRenderedYourUpdatesComponent: renderedUpdateMarkup
        });
        return next;

    }).catch(function (err) {

        res.status(500).send(err);
        return next;

    });

});

router.use("/static", express.static("static")); // Static files