/**
 * Created by yun on 4/4/15.
 */
var jwt        = require('jwt-simple');
var User       = require('../models/User');

module.exports = {

    authenticate: function(req, res, next)
    {
        // console.log("before authenticate");
        //var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
        var token = req.headers['x-access-token'];
        // console.log("token: " + token);
        if (token) {
            try {
                //var decoded = jwt.decode(token, app.get('jwtTokenSecret'));
                var decoded = jwt.decode(token, "YOUR_SECRET_STRING");

                // console.log("exp: " + decoded.exp);
                if (decoded.exp <= Date.now()) {
                    res.status(400).send('Token expired');
                }
                else {
                    // console.log("find user " );

                    User.findOne({_id: decoded.iss}, function (err, user) {
                        req.user = user;
                        console.log(req.user.email + ' pass the authentication');
                        next();
                    });
                }
            } catch (err) {
                console.log(err);
                res.status(403).send('Bad token');
            }
        } else {
            res.status(403).send('No token');
        }
    },

    authorize: function(req, res, next) {
        // console.log("before authorize");
        checkAuthorization(req, function (isAuthorized) {
            if (!isAuthorized) {
                res.send({message: 'Unauthorized', status: 401});
                console.log(req.user.email + ' fail the authorization');
            }
            else {
                console.log(req.user.email + ' pass the authorization');
                next();
            }
        });

        function checkAuthorization(req, callback) {
            // actual auth strategy goes here..
            var isAuthorized = req.user.isAdmin;
            callback(isAuthorized);
        }
    }
}
