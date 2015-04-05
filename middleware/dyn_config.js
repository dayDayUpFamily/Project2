/**
 * Created by yun on 4/4/15.
 */
var async   = require('async');
var auth    = require('./auth');
var logging = require('./logging');


var confirguration = {
    log_before: {
        priority: 100,
        enable: true
    },
    authenticate: {
        priority: 90,
        enable: true
    },
    authorize: {
        priority: 80,
        enable: true
    },
    /*
     service: {
     priority: 70,
     enable: true
     },
     */
    log_after: {
        priority: 60,
        enable: true
    }
}

// Function to sort the order of the middleware to be executed
var sortConfig = function (confirguration) {
    var sortable = [];
    for (var middleware in confirguration)
        // To make middlewares configurable
        if (confirguration[middleware]['enable'] == true) {
            sortable.push([middleware, confirguration[middleware]['priority']]);
        }

    sortable.sort(function (a, b) {
        return b[1] - a[1]
    });
    return sortable;
}
module.exports = {
    configurableMiddleWare: function (req, res, next)
    {
        var operations = [];

        var middleware;

        var sortedConfig = sortConfig(confirguration);

        // push each middleware you want to run
        sortedConfig.forEach(function (fn) {

            switch (fn[0]) {
                case 'log_before':
                    middleware = logging_service.log_before;
                    //middleware = log_before;
                    break;
                case 'authenticate':
                    middleware = auth_service.authenticate;
                    break;
                case 'authorize':
                    middleware = auth_service.authorize;
                    break;
                case 'service':
                    middleware = service2;
                    break;
                case 'log_after':
                    middleware = logging_service.log_after;
                    //middleware = log_after;
                    break;
            }

            console.log(fn[0]);
            console.log(middleware);

            operations.push(middleware.bind(null, req, res)); // could use fn.bind(null, req, res) to pass in vars     });

        });

        console.log('middleware list sorted');
        // now actually invoke the middleware in series
        async.series(operations, function (err) {
            if (err) {
                // one of the functions passed back an error so handle it here
                return next(err);
            }
            console.log('middleware get executed');
            // no errors so pass control back to express
            next();
        });
    }
}