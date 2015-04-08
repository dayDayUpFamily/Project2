/**
 * Created by yun on 4/4/15.
 */
var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var MWBeforeSchema   = new Schema({
    service_name:     String,
    mw_name:          String,
    priority:         Number,
    enable:           Boolean
});

module.exports = mongoose.model('MW_before', MWBeforeSchema, 'before_mws');