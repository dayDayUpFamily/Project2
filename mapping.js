var request    = require("request");

var urlTranslate = function(publicUrl)
{
    // define the translation rule here
    return publicUrl.replace("public", "private");
}

var getUsers = function(req, res, next)
{  // need x-access-token in http header, and start business_service.js
    if(req.before_mw_failure)  // if there was error before, skip
    {
        console.log("skip business_service");
        return next();
    }
    var publicUrl = req.url;
    request({
        uri: "http://127.0.0.1:8888"+urlTranslate(publicUrl),
        method: "GET"
    }, function(error, response, body) {
        console.log("business_service succeed!");
        res.send(body);
        next();
    });
}

var getOneUser = function(req, res, next)
{
    if(req.before_mw_failure)  // if there was error before, skip
    {
        console.log("skip business_service");
        return next();
    }
    var publicUrl = req.url;
    request({
        uri: "http://127.0.0.1:8888"+urlTranslate(publicUrl),
        method: "GET",
    }, function(error, response, body) {
        console.log("business_service succeed!");
        res.send(body);
        next();
    });
}

var putUser = function(req, res, next)
{
    if(req.before_mw_failure)  // if there was error before, skip
    {
        console.log("skip business_service");
        return next();
    }
    var publicUrl = req.url;
    request({
        uri: "http://127.0.0.1:8888"+urlTranslate(publicUrl),
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

var deleteUser = function(req, res, next)
{
    if(req.before_mw_failure)  // if there was error before, skip
    {
        console.log("skip business_service");
        return next();
    }
    var publicUrl = req.url;
    request({
        uri: "http://127.0.0.1:8888"+urlTranslate(publicUrl),
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

module.exports = {
    urlTranslate:urlTranslate,
    getUsers:getUsers,
    getOneUser:getOneUser,
    putUser:putUser,
    deleteUser:deleteUser
}