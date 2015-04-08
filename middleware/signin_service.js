/**
 * Created by yun on 4/4/15.
 */
var jwt        = require('jwt-simple');
var User       = require('../models/User');
var moment     = require("moment");

module.exports = {
    signin : function (req, res, next) {

        User.findOne({email: req.body.email}, function(err, user) {
            if (err) {
                res.json({
                    type: false,
                    data: "Error occured: " + err
                });
            } else {
                if (!user) {
                    // incorrect username
                    return res.sendStatus(401);
                }
                else if (user.password != req.body.password) {
                    // incorrect password
                    return res.sendStatus(401);
                }
                else
                {
                    console.log(user);
                    var expires = moment().add(6000, 'seconds').valueOf();
                    var token = jwt.encode({
                        iss: user.id,
                        exp: expires
                    }, "YOUR_SECRET_STRING");

                    res.json({
                        token : token,
                        expires: expires,
                        user: user.toJSON()
                    });
                }
            }
        });
    }
};