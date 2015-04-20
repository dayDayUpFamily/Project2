var redis      = require("redis");
var redis_client = redis.createClient();

module.exports = {
    check_nonce:function(req, res,next) {
        console.log("entering check_nonce");
        var req_nonce = req.headers['nonce'];
        if(!req_nonce)
        {
            console.log("no nonce");
            res.send("Please provide a valid nonce!");
            return next(new Error('no nonce'));
        }
        redis_client.get(req_nonce, function (err, reply){
            if(!reply) {
                redis_client.set(req_nonce, 1);
                console.log('get new nonce');
                return next();

            }
            else {
                //res.sendStatus(404);
                console.log("dupilcate request");
                res.send("Nonce dupilcate!");
                return next(new Error('dupilcate nonce'));
            }
        })
    }
}