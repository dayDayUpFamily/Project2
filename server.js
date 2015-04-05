// Required Modules
var express    = require("express");
var bodyParser = require("body-parser");
var mongoose   = require("mongoose");
var http       = require("http");

var app = express();
var port = process.env.PORT || 3333;

// yun add
var logging         = require('./middleware/logging');
var auth            = require('./middleware/auth');
var check           = require('./middleware/check');
var signin_service  = require('./middleware/signin_service');
var signup_service  = require('./middleware/signup_service');
var etag            = require('./middleware/etag');
var dyn_config      = require('./middleware/dyn_config');
var MW_before       = require('./models/MW_before');
var MW_after        = require('./models/MW_after');

var before_middleware_list = [bodyParser(), logging.log_before, auth.authenticate, auth.authorize, etag.etag_before]
var after_middleware_list = [logging.log_after, etag.etag_after]

// Connect to DB
mongoose.connect('mongodb://krist:krist@ds059471.mongolab.com:59471/express-test');

// set secret for jwt
app.set('jwtTokenSecret', 'YOUR_SECRET_STRING');

// use strong etags
app.set('etag', 'strong')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

app.post('/signin', check.checkEmailLegality, signin_service.signin);
app.post('/signup', check.checkEmailLegality, check.checkPasswordLegality, signup_service.signup);


function business_service(req, res, next) {  // need x-access-token in http header, and start business_service.js
    // User.find(function(err, users) {
    //     if (err)
    //         res.sendStatus(err);
    //     else
    //     {
    //         res.json(users);
    //         next();
    //     }
    // });

    var options = {  // mapping
        host: 'localhost',
        port: 8888,
        path: '/'
    };
    http.get(options, function(resp){  // make request to the business service
        resp.on('data', function(chunk){
            // console.log(chunk);
            res.send(chunk);  // return the response to the client (A strong etag is included in the header)
            // console.log(res._headers['etag']);
            next();
        });
    });
}


app.use('/users', function (req, res, next) {
    req.cur_service = "business_service";
    next();
});

app.use('/users', dyn_config.config_before_mws, business_service, dyn_config.config_after_mws);


/*
// add mw to before list or after list
// create a before middleware for a service
app.post('/mw_before', function(req, res) {
    MW_before.findOne({service_name: req.body.service_name, mw_name: req.body.mw_name}, function(err, mw) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            if (mw) {
                res.json({
                    type: false,
                    data: "The before middleware for the service already exists!"
                });
            } else {
                var instance = new MW_before();
                instance.service_name = req.body.service_name;
                instance.mw_name = req.body.mw_name;
                instance.priority = req.body.priority;
                instance.enable = req.body.enable || false;

                instance.save(function(err, mw) {
                    if (err)
                        res.sendStatus(err);
                    res.json({ message: 'Create a before middleware for the service' });
                    console.log(mw);
                });
            }
        }
    });
});

app.post('/mw_after', function(req, res) {
    MW_after.findOne({service_name: req.body.service_name, mw_name: req.body.mw_name}, function(err, mw) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            if (mw) {
                res.json({
                    type: false,
                    data: "The after middleware for the service already exists!"
                });
            } else {
                var instance = new MW_after();
                instance.service_name = req.body.service_name;
                instance.mw_name = req.body.mw_name;
                instance.priority = req.body.priority;
                instance.enable = req.body.enable || false;

                instance.save(function(err, mw) {
                    if (err)
                        res.sendStatus(err);
                    res.json({ message: 'Create a after middleware for the service' });
                    console.log(mw);
                });
            }
        }
    });
});
*/

//app.get('/users', before_middleware_list, business_service, after_middleware_list);
app.listen(port);
console.log('Magic happens on port ' + port);