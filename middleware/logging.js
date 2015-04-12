/**
 * Created by yun on 4/4/15.
 */
var AWS = require('aws-sdk');
var sqs = new AWS.SQS({credentials: new AWS.SharedIniFileCredentials(), region: 'us-west-2'});

module.exports = {
    log_before : function (req, res, next) {
        // console.log(next);
        sendMessage("myQueue",req.url+"  "+req.method);
        console.log('before logging!');
        next();
    },
    log_after : function (req, res, next) {
        console.log('after logging!');
        next();
    }
};

var sendMessage = function sendMessage(queue, message) {
    sqs.getQueueUrl( {QueueName: queue,QueueOwnerAWSAccountId: '417492040315'}, function(err, data) {
        if (err) {
            console.log(err, err.stack);
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



