var redis      = require("redis");
var redis_client = redis.createClient();

module.exports = {
    check_nonce:function(req, res,next) {
        console.log(req.headers['nonce']);
        next();
    }

}