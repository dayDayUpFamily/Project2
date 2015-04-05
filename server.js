// Required Modules
var express    = require("express");
// var morgan     = require("morgan");
var bodyParser = require("body-parser");
var jwt        = require('jwt-simple');
var mongoose   = require("mongoose");
var moment     = require("moment");
var app        = express();

// yun add
var cur_service;
var configArray = [];
var mw_before_array = [];
var mw_after_array = [];

var async       = require('async');
var logging     = require('./middleware/logging');
var auth        = require('./middleware/auth');
var dyn_config  = require('./middleware/dyn_config');
var Middleware  = require('./schema/middleware');
var MW_before   = require('./models/MW_before');
var MW_after    = require('./models/MW_after');



var port = process.env.PORT || 3001;
var User = require('./models/User');
//var before_middleware_list = [bodyParser(), logging.log_before, authenticate, authorize]
var before_middleware_list = [logging.log_before, auth.authenticate, auth.authorize]
var after_middleware_list = [logging.log_after]


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
    service: {
        priority: 70,
        enable: true
    },
    log_after: {
        priority: 60,
        enable: true
    }
}


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
                middleware = authenticate;
                break;
            case 'authorize':
                middleware = authorize;
                break;
            case 'service':
                middleware = cur_service;
                break;
            case 'log_after':
                middleware = logging.log_after;
                //middleware = log_after;
                break;
        }
        console.log(fn[0]);
        console.log(middleware);

        operations.push(middleware.bind(null, req, res)); // could use fn.bind(null, req, res) to pass in vars     });

    });

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
}



function init_after_mws(req, res, next) {
    console.log("init after mw list for current service" );
    mw_after_array = [];
    MW_after.find({service_name: cur_service}, function(err, middlewares) {
        if (err)
            return res.status(403).send('query middleware configuaration error');
        else
        {
            middlewares.forEach(function(mw) {
                    mw_after_array.push(mw);
                }
            )
            next();
        }
    });
}

function init_before_mws(req, res, next) {
    console.log("init before mw list for current service: " + cur_service);
    mw_before_array = [];
    MW_before.find({service_name: cur_service}, function(err, middlewares) {
        if (err)
            return res.status(403).send('query middleware configuaration error');
        else
        {
            middlewares.forEach(function(mw) {
                    mw_before_array.push(mw);
                }
            )
            next();
        }
    });
}

function config_before_mws(req, res, next)
{
    configArray = mw_before_array;
    configurableMiddleWare(req, res, next);
}

function config_after_mws(req, res, next)
{
    configArray = mw_after_array;
    configurableMiddleWare(req, res, next);
}

// Connect to DB
mongoose.connect('mongodb://krist:krist@ds059471.mongolab.com:59471/express-test');

// set secret for jwt
app.set('jwtTokenSecret', 'YOUR_SECRET_STRING');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(morgan("dev"));  // request logging
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

function checkEmailLegality(req, res, next)
{
    if (typeof req.body.email == "undefined")  // feel free to add other email rules here
        return res.status(403).send('Empty email string');
    next();
}

function checkPasswordLegality(req, res, next)
{
    if (typeof req.body.password == "undefined")  // feel free to add other email rules here
        return res.status(403).send('Empty password string');
    else if(req.body.password.length < 8)
        return res.status(403).send('Password legnth should be at least 8!');
    next();
}

app.post('/signin', checkEmailLegality, function(req, res) {
    User.findOne({email: req.body.email}, function(err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            if (!user) {
                // incorrect username
                return res.sendStatus(401);
            }
            else if (user.password != req.body.password) {
                // incorrect password
                return res.sendStatus(401);
            }
            else
            {
                console.log("sign in successfully!");
                console.log(user);
                var expires = moment().add(600, 'seconds').valueOf();
                var token = jwt.encode({
                    iss: user.id,
                    exp: expires
                }, app.get('jwtTokenSecret'));

                res.json({
                    token : token,
                    expires: expires,
                    user: user.toJSON()
                });
            }
        }
    });
});

app.post('/signup', checkEmailLegality, checkPasswordLegality, function(req, res) {
    User.findOne({email: req.body.email}, function(err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            if (user) {
                res.json({
                    type: false,
                    data: "User already exists!"
                });
            } else {
                var userModel = new User();
                userModel.email = req.body.email;
                userModel.password = req.body.password;
                userModel.isAdmin = req.body.isAdmin || false
                userModel.save(function(err, user) {
                    if (err)
                        res.sendStatus(err);
                    res.json({ message: 'User created!' });
                    console.log(user);
                });
            }
        }
    });
});

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

function log_mw(req, res, next)
{
    console.log('logging!');
    next();
}

function log_before(req, res, next)
{
    console.log('before logging!');
    next();
}


function log_after(req, res, next)
{
    console.log('after logging!');
    next();
}


function authenticate(req, res, next) {
    console.log("before authenticate");
    var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
    if (token) {
        try {
            var decoded = jwt.decode(token, app.get('jwtTokenSecret'));
            if (decoded.exp <= Date.now()) {
                res.status(400).send('Token expired');
            }
            else
            {
                User.findOne({ _id: decoded.iss }, function(err, user) {
                    req.user = user;
                    console.log(req.user.email + ' pass the authentication');
                    next();
                });
            }
        } catch (err) {
            console.log("err: " + err);
            res.status(403).send('Bad token');
        }
    } else {
        res.status(403).send('No token');
    }
}

function authorize(req, res, next) {
    console.log("before authorize");
    checkAuthorization(req, function (isAuthorized) {
        if (!isAuthorized) {
            res.send({message: 'Unauthorized', status: 401});
            console.log(req.user.email + ' fail the authorization');
        }
        else
        {
            console.log(req.user.email + ' pass the authorization');
            next();
        }
    });

    function checkAuthorization(req, callback) {
        // actual auth strategy goes here..
        var isAuthorized = req.user.isAdmin;
        callback(isAuthorized);
    }
}

function business_service(req, res, next) {  // need x-access-token in http header
    User.find(function(err, users) {
        if (err)
            res.sendStatus(err);
        else
        {
            res.json(users);
            next();
        }
    });
}


//app.get('/users', before_middleware_list, business_service, after_middleware_list);
app.use('/users', function (req, res, next) {
    cur_service = "business_service";
    next();
});

app.use('/users', init_before_mws, config_before_mws, business_service, init_after_mws, config_after_mws);


app.listen(port);
console.log('Magic happens on port ' + port);