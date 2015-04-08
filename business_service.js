var express = require('express');
var User = require('./models/User');
var mongoose   = require("mongoose");
var bodyParser = require("body-parser");
var app = express();

// Connect to DB
mongoose.connect('mongodb://krist:krist@ds059471.mongolab.com:59471/express-test');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/private/users', function (req, res) {  // get all users
    console.log("GET /private/users");
    User.find(function(err, users) {
        if (err)
            res.sendStatus(err);
        else
        {
            console.log("return users");
            res.json(users);
            // next();
        }
    });
});

app.get('/private/user/:id', function (req, res) {  // get one user
    console.log("GET /private/user/:id");
    var userId = req.params.id;
    var query = {"_id": userId};
    User.findOne(query, function(err, user) {
        if (err)
            res.sendStatus(err);
        else if(!user) {
            res.sendStatus(404);
            console.log("no such user: "+userId);
        }
        else
        {
            console.log("return user: "+userId);
            res.json(user);
            // next();
        }
    });
});

// app.post('/', function (req, res) {  // add a new user
//     res.send('Business service!');
// });

app.put('/private/user/:id', function (req, res) {
    // res.send('Business service!');
    console.log("PUT /private/user/:id");
    var userId = req.params.id;
    // var newData = req.body;
    // var fields = ['email', 'password', 'isAdmin'];
    var newData = {email:req.body.email, password:req.body.password, isAdmin:req.body.isAdmin};
    var options = {new: true};
    // var userDataProjected = lodash.pick(newData, fields);
    User.findOneAndUpdate(userId, newData, options, function (err, user) {
        if(err)
            res.sendStatus(err);
        else
        {
            console.log(user);
            res.sendStatus(200);
            // next();
        }
    });
});

app.delete('/private/user/:id', function (req, res) {
    console.log("DELETE /private/user/:id");
    // res.send('Business service!');
    var userId = req.params.id;
    User.remove({_id: userId}, function (dbErr, dbResult) {
        if (dbErr)
            res.sendStatus(err);
        else
        {
            console.log("delete user "+req.params.id);
            res.sendStatus(200);
            // next();
        }
    });
});

var server = app.listen(8888, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Business service listening at http://%s:%s', host, port);

});