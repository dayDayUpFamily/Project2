/**
 * Created by yun on 4/4/15.
 */
var User       = require('../models/User');

module.exports = {
    signup : function (req, res, next) {
        User.findOne({email: req.body.email}, function(err, user) {
            if (err) {
                res.json({
                    type: false,
                    data: "Error occured: " + err
                });
            } else {
                if (user) {
                    res.json({
                        type: false,
                        data: "User already exists!"
                    });
                } else {
                    var userModel = new User();
                    userModel.email = req.body.email;
                    userModel.password = req.body.password;
                    userModel.isAdmin = req.body.isAdmin || false
                    userModel.save(function(err, user) {
                        if (err)
                            res.sendStatus(err);
                        res.json({ message: 'User created!' });
                        console.log(user);
                    });
                }
            }
        });
    }
};