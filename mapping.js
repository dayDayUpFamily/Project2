var request    = require("request");

exports.getUsers = function(req, res, next) {  // need x-access-token in http header, and start business_service.js
    request({
        uri: "http://127.0.0.1:8888/private/users",
        method: "GET",
    }, function(error, response, body) {
        console.log("business_service succeed!");
        res.send(body);
        next();
    });
}

exports.getOneUser = function(req, res, next) {
    request({
        uri: "http://127.0.0.1:8888/private/user/"+req.params.id,
        method: "GET",
    }, function(error, response, body) {
        console.log("business_service succeed!");
        res.send(body);
        next();
    });
}

exports.putUser = function(req, res, next)
{
    request({
        uri: "http://127.0.0.1:8888/private/user/"+req.params.id,
        method: "PUT",
        form: {
            email:req.body.email,
            password:req.body.password,
            isAdmin:req.body.isAdmin
        }
    }, function(error, response, body) {
        if(error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
            res.send(body);
            next();
        }
    });
}

exports.deleteUser = function(req, res, next)
{
    request({
        uri: "http://127.0.0.1:8888/private/user/"+req.params.id,
        method: "DELETE"
    }, function(error, response, body) {
        if(error) {
            console.log(error);
        } else {
            console.log(response.statusCode, body);
            res.send(body);
            next();
        }
    });
}