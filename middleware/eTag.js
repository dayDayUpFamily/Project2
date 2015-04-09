/**
 * Created by yun on 4/4/15.
 */
var request      = require("request");
var crypto       = require("crypto");
var redis        = require("redis");
var redis_client = redis.createClient();
var mapping      = require("../mapping");

function updateEtagInRedis (key, value) {
    redis_client.set(key, value);
    console.log("redis: setting the etag of " + key + " to " + value);
    return;
}

function getEtagFromResponseAndUpdate (publicUrl, callback) {
    request({
        uri: "http://127.0.0.1:8888"+mapping.urlTranslate(publicUrl),
        method: "GET",
    }, function(error, response, body) {
        // console.log(crypto.createHash('md5').update(body).digest('base64'));
        // console.log("http://127.0.0.1:8888"+mapping.urlTranslate(publicUrl));
        // console.log("body: "+body);
        var newEtag = crypto.createHash('md5').update(body).digest('base64');
        callback(publicUrl, newEtag);
        // return crypto.createHash('md5').update(body).digest('base64'); 
        // console.log(response);
        // console.log("***etag: "+response._headers['etag']);
    });

}

module.exports = {

    etag_before: function (req, res, next) {  // check whether client etag and server etag are the same
        if(req.before_mw_failure)  // if there was error before, skip
        {
            console.log("skip etag_before");
            return next();
        }
        console.log("entering etag_before");
        var cEtag = req.headers['if-none-match'];
        console.log("cEtag: " + cEtag);
        var sEtag;
        redis_client.get(req.url, function (err, reply) {
        // reply is null when the key is missing
            sEtag = reply;
            console.log("sEtag: " + sEtag);
            if (req.method == "GET") { // if it's a get request
                // console.log("182");
                if (sEtag) // server Etag is not empty
                {
                    // console.log("185");
                    if (cEtag) { // client Etag is not empty
                        // console.log("188");
                        if (cEtag == sEtag) {
                            console.log("You have requested this and it's not changed!");
                            // return res.status(304).send("You have requested this and it's not changed!");
                            req.before_mw_failure = true;
                            res.send("You have requested this and it's not changed!");
                        }
                    }
                }
                else  // server etag is empty, need to add to redis
                {
                    console.log("199");
                    req.etagRedisFlag = "create";
                }
                console.log("202");
                // next();
            }
            if (req.method == "DELETE" || req.method == "PUT") // if it's a delete/put request
            {
                // console.log("49");
                if (sEtag) // server Etag is not empty
                {
                    if (cEtag && cEtag==sEtag)  // client Etag is valid
                    {
                        req.etagRedisFlag = "update";
                        // next();  // continue operation
                    }
                    else
                    {
                        req.before_mw_failure = true;
                        console.log("etag fail");
                        res.send("please provide a valid etag!");
                    }
                }
                else  // server etag is empty, need to add to redis
                {
                    // req.etagRedisFlag = true;
                    req.before_mw_failure = true;
                    console.log("etag fail");
                    res.send("etag is not in redis, please getOneUser first");
                    // if (cEtag)  // if server Etag is empty but client Etag is not empty
                    //     next();
                }
                // res.send("need to provide the latest etag!");
                // next();
            }
            next();
        });
    },

    etag_after: function (req, res, next)  // create or update etag in redis
    {
        if(req.before_mw_failure)  // if there was error before, skip
        {
            console.log("skip etag_after");
            return next();
        }
        console.log("entering etag_after");
        // console.log(req.etagRedisFlag);
        // var ori_etag = res._headers['etag'];
        // console.log(ori_etag.slice(1, ori_etag.length-1));
        if (req.etagRedisFlag) {
            if (req.etagRedisFlag=="create")
                updateEtagInRedis(req.url, res._headers['etag']);  // hashing the key should be better...but I'm lazy
            if (req.etagRedisFlag=="update")
            {
                // update two etags: 1. getall; 2.get one
                getEtagFromResponseAndUpdate(req.url, updateEtagInRedis);
                // updateEtagInRedis(req.url, newEtag);  // hashing the key should be better...but I'm lazy
            }
        }
        next();
    }
}