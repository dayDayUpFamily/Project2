/**
 * Created by yun on 4/2/15.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');

module.exports = function(url, app){
    var routeDir = path.join(__dirname + '/../routes');
    fs.readdirSync(routeDir).forEach(function(file){
        var config = require(routeDir + '/' + file + '/config.json');
        config.url = url;
        config.routeDir = routeDir;
        route(app, config);
    })
}

function route (app, config) {
    var api = require(config.routeDir + '/' + config.name);
    config.routes.forEach(function (route) {
        var fn = api[route['function']];
        var uri = config.url + route.path;
        var method = route.method.toLowerCase();
        app[method](uri, fn);
    });
}
