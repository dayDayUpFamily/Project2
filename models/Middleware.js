/**
 * Created by yun on 4/4/15.
 */
var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var MiddlewareSchema   = new Schema({
    service_name:     String,
    mw_name:          String,
    priority:         Number,
    enable:           Boolean
});

module.exports = mongoose.model('Mw_before', MiddlewareSchema, before_mws);
module.exports = mongoose.model('Mw_after', MiddlewareSchema, after_ms);ååå
