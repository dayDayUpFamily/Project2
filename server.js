// Required Modules
var express    = require("express");
// var morgan     = require("morgan");
var bodyParser = require("body-parser");
var jwt        = require('jwt-simple');
var mongoose   = require("mongoose");
var moment     = require("moment");
var http       = require("http");
var redis      = require("redis");
var User       = require('./models/User');

var app = express();
var redis_client = redis.createClient();
var port = process.env.PORT || 3001;
var before_middleware_list = [bodyParser(), log_mw, authenticate, authorize, etag_before]
var after_middleware_list = [log_mw, etag_after]

// Connect to DB
mongoose.connect('mongodb://krist:krist@ds059471.mongolab.com:59471/express-test');

// set secret for jwt
app.set('jwtTokenSecret', 'YOUR_SECRET_STRING');

// use strong etags
app.set('etag', 'strong')

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

// function getServerEtagFromRedis(key)
// {
//     return redis_client.get(key);
// }

function etag_before(req, res, next) {  // check whether client etag and server etag are the same
    console.log("entering etag_before");
    var cEtag = req.headers['if-none-match'];
    console.log("cEtag: "+cEtag);
    var sEtag;
    redis_client.get(req.url, function(err, reply) {  
        // reply is null when the key is missing
        sEtag = reply;
        console.log("sEtag: "+sEtag);
        if(req.method == "GET") // if it's a get request
        {
            // console.log("182");
            if(sEtag) // server Etag is not empty
            {
                // console.log("185");
                if(cEtag)  // client Etag is not empty
                {
                    // console.log("188");
                    if(cEtag == sEtag)
                    {
                        console.log("You have requested this and it's not changed!");
                        // return res.status(304).send("You have requested this and it's not changed!");
                        return res.send("You have requested this and it's not changed!");
                    }
                }
            }
            else  // server etag is empty, need to add to redis
            {
                console.log("199");
                req.etagRedisFlag = true;
            }
            console.log("202");
            next();
        }
        if(req.method == "DELETE" || req.method == "POST" || req.method == "PUT") // if it's a delete/post/put request
        {
            if(sEtag) // server Etag is not empty
            {
                if(cEtag)  // client Etag is not empty
                {
                    if(cEtag == sEtag)
                    {
                        req.etagRedisFlag = true;
                        next();  // continue operation
                    }
                }
            }
            else  // server etag is empty, need to add to redis
            {
                req.etagRedisFlag = true;
                if(cEtag)  // if server Etag is empty but client Etag is not empty
                    next();
            }
        }
    });
}

function updateEtagInRedis(key, value)
{
    redis_client.set(key, value);
    console.log("redis: setting "+key+" to "+value);
    return;
}

function etag_after(req, res, next)  // update etag in redis
{
    console.log("entering etag_after");
    // console.log(res._headers['etag']);
    var ori_etag = res._headers['etag'];
    // console.log(ori_etag.slice(1, ori_etag.length-1));
    if(req.etagRedisFlag)
    {
        updateEtagInRedis(req.url, ori_etag.slice(1, ori_etag.length-1));  // hashing the key should be better...but I'm lazy
    }
    next();
}

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

app.get('/users', before_middleware_list, business_service, after_middleware_list);

app.listen(port);
console.log('Magic happens on port ' + port);