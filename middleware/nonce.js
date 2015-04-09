var redis      = require("redis");
var redis_client = redis.createClient();

module.exports = {
    check_nonce:function(req, res,next) {
        var req_nonce = req.headers['nonce'];
        redis_client.get(req_nonce, function (err, reply) {
            if(!reply) {
                redis_client.set(req_nonce, 1);
                console.log('get new nonce');
                next();
            }
            else {
                res.sendStatus(404);
                console.log("dupilcate request");
            }
        })
    }

}