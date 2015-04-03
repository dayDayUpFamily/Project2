// Required Modules
var express    = require("express");
// var morgan     = require("morgan");
var bodyParser = require("body-parser");
var jwt        = require('jwt-simple');
var mongoose   = require("mongoose");
var moment     = require("moment");
var app        = express();

// yun add
var logging = require('./middleware/logging');


var port = process.env.PORT || 3333;
var User = require('./models/User');
//var logging = require("./middleware/logging");
//var before_middleware_list = [bodyParser(), logging.log_before, authenticate, authorize]
var before_middleware_list = [logging.log_before, authenticate, authorize]
var after_middleware_list = [logging.log_after]

// yun add for dynamic chain of middleware
var cur_service;
var Middleware = require('./schema/middleware');
var async = require('async');

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

function initMiddlewares() {
    Middleware.find(function(err, middlewares) {
        if (err)
            console.log(err);
        else
        {
            //res.json(middlewares);
            console.log(res);
            next();
        }
    });
}

// Function to sort the order of the middleware to be executed
var sortConfig = function(confirguration){
    var sortable = [];
    for (var middleware in confirguration)
        // To make middlewares configurable
        if (confirguration[middleware]['enable'] == true){
            sortable.push([middleware, confirguration[middleware]['priority']]);
        }

    sortable.sort(function(a, b) {return b[1] - a[1]});
    return sortable;
}

function configurableMiddleWare(req, res, next) {
    var operations = [];

    var middleware;

    var sortedConfig = sortConfig(confirguration);

    // push each middleware you want to run
    sortedConfig.forEach(function(fn) {

        switch(fn[0]){
            case 'log_before':
                //middleware = logging.log_before;
                middleware = log_before;
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
                //middleware = logging.log_after;
                middleware = log_after;
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

function service2(req, res, next) {  // need x-access-token in http header
    console.log("do service 2");
    Middleware.find(function(err, middlewares) {
        if (err)
            res.sendStatus(err);
        else
        {
            res.json(middlewares);
            next();
        }
    });
}

//app.get('/users', before_middleware_list, business_service, after_middleware_list);


app.use('/users', function (req, res, next) {
    cur_service = business_service;
    configurableMiddleWare(req, res, next);
});


app.get('/middlewares', function (req, res, next) {
    cur_service = service2;
    configurableMiddleWare(req, res, next);
});


//app.get('/users', before_middleware_list, business_service, after_middleware_list);

app.listen(port);
console.log('Magic happens on port ' + port);