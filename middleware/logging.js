/**
 * Created by yun on 4/4/15.
 */
module.exports = {
    log_before : function (req, res, next) {
        // console.log(next);
        console.log('before logging!');
        next();
    },
    log_after : function (req, res, next) {
        // console.log(next);
        console.log('after logging!');
        next();
    }
};
