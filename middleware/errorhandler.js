/**
 * Created by YuzhongJi on 4/11/15.
 */

var AWS = require('aws-sdk');
var sns = new AWS.SNS({credentials: new AWS.SharedIniFileCredentials(), region: 'us-west-2'});
var logging = require('./logging')

module.exports = function (err, req, res, next) {
    console.log('Error at time:', new Date());
    console.log(err);
    logging.logging2sqs("myQueue", "ERROR: "+req.url+"  "+req.method+"  "+err);  // error logging
     publish(err.message);  // SNS

    // console.log("headers   "+res.headers);
   /* res.status(err.statusCode || err.status || 500);
    res.json({
        error: {code: err.statusCode, message: err.message},
        data:{}
    });*/
}


var publish = function snsPublish(message) {

    params = {
        TopicArn: 'arn:aws:sns:us-west-2:417492040315:log',
        Message: message
    };

    sns.publish(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
        } else {
            console.log('Published a SNS.',message);
        }
    });
};