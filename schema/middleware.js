/**
 * Created by yun on 4/2/15.
 */
/**
 * Created by yun on 4/2/15.
 */
var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var MiddlewareSchema   = new Schema({
        name:     String,
        priority: Number,
        enable:   Boolean
});

module.exports = mongoose.model('Middleware', MiddlewareSchema);