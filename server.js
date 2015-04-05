// Required Modules
var express    = require("express");
// var morgan     = require("morgan");
var bodyParser = require("body-parser");
var jwt        = require('jwt-simple');
var mongoose   = require("mongoose");
var moment     = require("moment");
var http       = require("http");
var User       = require('./models/User');

var app = express();
var port = process.env.PORT || 3001;

// yun add
var logging         = require('./middleware/logging');
var auth            = require('./middleware/auth');
var check           = require('./middleware/check');
var signin_service  = require('./middleware/signin_service');
var signup_service  = require('./middleware/signup_service');
var etag            = require('./middleware/etag');

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

app.get('/users', before_middleware_list, business_service, after_middleware_list);

app.listen(port);
console.log('Magic happens on port ' + port);