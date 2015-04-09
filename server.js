// Required Modules
var express    = require("express");
var bodyParser = require("body-parser");
var mongoose   = require("mongoose");
// var http       = require("http");
var request    = require("request");
var crypto     = require("crypto");

var app = express();
var port = process.env.PORT || 3001;

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
var mapping         = require('./mapping');

// var before_middleware_list = [bodyParser(), logging.log_before, auth.authenticate, auth.authorize, etag.etag_before]
// var after_middleware_list = [logging.log_after, etag.etag_after]

// Connect to DB
mongoose.connect('mongodb://krist:krist@ds059471.mongolab.com:59471/express-test');

// set secret for jwt
app.set('jwtTokenSecret', 'YOUR_SECRET_STRING');

// use strong etags
// app.set('etag', 'strong')

// use our own hash function to generate etag 
app.set('etag', function(body, encoding){return crypto.createHash('md5').update(body, encoding).digest('base64') });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

app.post('/signin', check.checkEmailLegality, signin_service.signin);
app.post('/signup', check.checkEmailLegality, check.checkPasswordLegality, signup_service.signup);


app.use('/public/*', function (req, res, next)
{
    if (req.method=="GET")
    {
        // if (req.url=="/public/users")
            req.cur_service = "getUsers";  // need to match with the db
        // if (req.url.lastIndexOf("/public/user/", 0) === 0)
        //     req.cur_service = "getOneUsers";
    }
    else if (req.method=="PUT")
        req.cur_service = "putUser";  // need to match with the db
    else if (req.method=="DELETE")
        req.cur_service = "deleteUser";  // need to match with the db
    else
    {
        req.before_mw_failure = true
        return res.send("unsupportted request type: "+req.method);
    }
    next();
});

// api manager
app.get('/public/users', dyn_config.config_before_mws, mapping.getUsers, dyn_config.config_after_mws);
app.get('/public/user/:id', dyn_config.config_before_mws, mapping.getOneUser, dyn_config.config_after_mws);
app.put('/public/user/:id', dyn_config.config_before_mws, mapping.putUser, dyn_config.config_after_mws);
app.delete('/public/user/:id', dyn_config.config_before_mws, mapping.deleteUser, dyn_config.config_after_mws);


app.listen(port);
console.log('Magic happens on port ' + port);