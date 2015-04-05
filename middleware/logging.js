/**
 * Created by yun on 4/1/15.
 */

module.exports = {
    log_before : function (req, res, next) {
        console.log(next);
        console.log('before logging!');
        next();
    },
    log_after : function (req, res, next) {
        console.log
        console.log('after logging!');
        next();
    }
};
