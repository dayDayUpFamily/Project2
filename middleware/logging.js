/**
 * Created by yun on 4/4/15.
 */
var AWS = require('aws-sdk');
var sqs = new AWS.SQS({credentials: new AWS.SharedIniFileCredentials(), region: 'us-west-2'});

var logging2sqs = function (queue, message) {
    sqs.getQueueUrl( {QueueName: queue}, function(err, data) {
        if (err) {
            // console.log(err, err.stack);
            return;
        }
        if (data.QueueUrl) {
            sqs.sendMessage({ QueueUrl: data.QueueUrl, MessageBody: message }, function(err, data) {
                if (err) {
                    console.log(err);
                }
            });
        }
    });
};

module.exports = {
    log_before : function (req, res, next) {
        // console.log(next);
        logging2sqs("myQueue", "before logging: "+req.url+"  "+req.method);
        console.log('before logging!');
        next();
    },
    log_after : function (req, res, next) {
        logging2sqs("myQueue", "after logging: "+req.url+"  "+req.method);
        console.log('after logging!');
        next();
    },
    logging2sqs:logging2sqs
};