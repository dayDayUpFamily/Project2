/**
 * Created by yun on 4/4/15.
 */
var redis      = require("redis");
var redis_client = redis.createClient();
var mapping = require('../mapping');

function updateEtagInRedis (key, value) {
    redis_client.set(key, value);
    console.log("redis: setting the etag of " + key + " to " + value);
    return;
}

module.exports = {

    etag_before: function (req, res, next) {  // check whether client etag and server etag are the same
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
                            return res.send("You have requested this and it's not changed!");
                        }
                    }
                }
                else  // server etag is empty, need to add to redis
                {
                    console.log("199");
                    req.etagRedisFlag = "create";
                }
                console.log("202");
                next();
            }
            if (req.method == "DELETE" || req.method == "PUT") // if it's a delete/put request
            {
                console.log("49");
                if (sEtag) // server Etag is not empty
                {
                    if (cEtag && cEtag==sEtag)  // client Etag is valid
                    {
                        req.etagRedisFlag = "update";
                        next();  // continue operation
                    }
                    else
                    {
                        req.before_mw_failure = true;
                        return res.send("please provide a valid etag!");
                    }
                }
                else  // server etag is empty, need to add to redis
                {
                    // req.etagRedisFlag = true;
                    req.before_mw_failure = true;
                    return res.send("etag is not in redis, please getOneUser first");
                    // if (cEtag)  // if server Etag is empty but client Etag is not empty
                    //     next();
                }
                // res.send("need to provide the latest etag!");
                // next();
            }
        });
    },

    etag_after: function (req, res, next)  // create or update etag in redis
    {
        console.log("entering etag_after");
        // console.log(res._headers['etag']);
        var ori_etag = res._headers['etag'];
        // console.log(ori_etag.slice(1, ori_etag.length-1));
        if (req.etagRedisFlag) {
            if (req.etagRedisFlag=="create")
                updateEtagInRedis(req.url, ori_etag.slice(1, ori_etag.length - 1));  // hashing the key should be better...but I'm lazy
            if (req.etagRedisFlag=="update")
            {
                // update two etags: 1. getall; 2.get one
                updateEtagInRedis(req.url, ori_etag.slice(1, ori_etag.length - 1));  // hashing the key should be better...but I'm lazy
            }
        }
        next();
    }
}