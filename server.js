// Required Modules
var express    = require("express");
// var morgan     = require("morgan");
var bodyParser = require("body-parser");
var jwt        = require('jwt-simple');
var mongoose   = require("mongoose");
var moment     = require("moment");
var app        = express();

var port = process.env.PORT || 3001;
var User     = require('./models/User');
var before_middleware_list = [bodyParser(), log_mw, authenticate, authorize]
var after_middleware_list = [bodyParser(), log_mw]

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
                console.log(user);
                var expires = moment().add(60, 'seconds').valueOf();
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

function authenticate(req, res, next) {
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

app.use('/users', before_middleware_list);  // before list
app.get('/users', function(req, res) {  // need x-access-token in http header
    User.find(function(err, users) {
        if (err)
            res.sendStatus(err);
        res.json(users)
    });
});
app.use('/users', after_middleware_list);  //after list...should excute after the main function...need change!

app.listen(port);
console.log('Magic happens on port ' + port);