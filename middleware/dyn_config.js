/**
 * Created by yun on 4/4/15.
 */
var async       = require('async');
var auth        = require('./auth');
var logging     = require('./logging');
var etag        = require('./etag');
var MW_before   = require('../models/MW_before');
var MW_after    = require('../models/MW_after');

var configArray = [];

// Function to sort the order of the middleware to be executed
var sortConfig = function(configArray){
    var sortable = [];
    console.log("size: " + configArray.length);
    for(i = 0; i < configArray.length; i++) {
        console.log(configArray[i].mw_name);
        if(configArray[i].enable == true) {
            sortable.push([configArray[i].mw_name, configArray[i].priority]);
        }
    }

    sortable.sort(function(a, b) {return b[1] - a[1]});
    return sortable;
}

function configurableMiddleWare(req, res, next) {
    var operations = [];
    var middleware;
    var sortedConfig = sortConfig(configArray);
    console.log("------- " + "begin sorting" + " -------");
    // push each middleware you want to run
    sortedConfig.forEach(function(fn) {

        switch(fn[0]){
            case 'log_before':
                middleware = logging.log_before;
                //middleware = log_before;
                break;
            case 'authenticate':
                middleware = auth.authenticate;
                break;
            case 'authorize':
                middleware = auth.authorize;
                break;
            case 'service':
                middleware = req.cur_service;
                break;
            case 'log_after':
                middleware = logging.log_after;
                //middleware = log_after;
                break;
            case 'etag_before':
                middleware = etag.etag_before;
                break;
            case 'etag_after':
                middleware = etag.etag_after;
                break;
        }
        console.log(fn[0]);
        console.log(middleware);

        operations.push(middleware.bind(null, req, res)); // could use fn.bind(null, req, res) to pass in vars     });

    })

    console.log('middleware list sorted');
    // now actually invoke the middleware in series
    async.series(operations, function(err) {
        if(err) {
            // one of the functions passed back an error so handle it here
            return next(err);
        }
        console.log('middleware get executed');
        // no errors so pass control back to express
        next();
    });
};


module.exports = {


    config_before_mws: function (req, res, next)
    {
        console.log("init before mw list for current service: " + req.cur_service);
        configArray = [];
        MW_before.find({service_name: req.cur_service}, function(err, middlewares) {
            if (err)
                return res.status(403).send('query middleware configuaration error');
            else
            {
                middlewares.forEach(function(mw) {
                    configArray.push(mw);
                })
                configurableMiddleWare(req, res, next);
            }
        });
    },

    config_after_mws: function (req, res, next)
    {
        console.log("init after mw list for current service:" + req.cur_service );
        configArray = [];
        MW_after.find({service_name: req.cur_service}, function(err, middlewares) {
            if (err)
                return res.status(403).send('query middleware configuaration error');
            else
            {
                middlewares.forEach(function(mw) {
                    configArray.push(mw);
                }
                )
                configurableMiddleWare(req, res, next);
            }
        });
    }
}