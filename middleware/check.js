/**
 * Created by yun on 4/4/15.
 */
module.exports = {

    checkEmailLegality: function (req, res, next) {
        if (typeof req.body.email == "undefined")  // feel free to add other email rules here
            return res.status(403).send('Empty email string');
        next();
    },
    checkPasswordLegality: function (req, res, next)
    {
        if (typeof req.body.password == "undefined")  // feel free to add other email rules here
            return res.status(403).send('Empty password string');
        else if(req.body.password.length < 8)
            return res.status(403).send('Password legnth should be at least 8!');
        next();
    }
}