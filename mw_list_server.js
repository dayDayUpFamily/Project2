var express = require('express');
var app = express();
var MW_before = require('./models/MW_before');
var MW_after = require('./models/MW_after');
var beforeList = [];
var afterList = [];
var mongoose = require("mongoose");
var async = require('async');

mongoose.connect('mongodb://krist:krist@ds059471.mongolab.com:59471/express-test');

function configurableMiddleWare(req, res, next) {
  console.log(9);
  console.log(beforeList);
}

app.get('/mwlist/:biz_name', function (req, res) {
  beforeList = [];
  afterList = [];
  // console.log(req.params.biz_name);
  async.parallel([beforefind,afterfind],function(err,result){
    console.log(result);
    if(err)return res.status(403).send('query middleware configuaration error');
     return res.send("beforeList:"+beforeList+"\n"+"afterList:"+afterList+"\n");

  })
  function beforefind(callback){
  MW_before.find({service_name: req.params.biz_name}, function(err, middlewares) {
     console.log("before list",middlewares);
    if (err) return callback(err);
    else
    {
      // console.log(19);
      for(i = 0; i < middlewares.length; i++)
        beforeList.push(middlewares[i].mw_name);
      return callback(null,beforeList);
    }
  });
  }
  function afterfind(callback){
  MW_after.find({service_name: req.params.biz_name}, function(err, middlewares) {
    console.log("after list",middlewares);
    if (err)
      return callback(err);
    else
    {
      for(i = 0; i < middlewares.length; i++)
        afterList.push(middlewares[i].mw_name);
      return callback(null,afterList);
    }
  });
  }
  // res.send(beforeList);
  // console.log(37);
});

app.put('/mwlist/:biz_name/:mw_name/:new_priority', function (req, res) {
  var service_name=req.params.biz_name;
  var mw_name=req.params.mw_name;
  var new_priority=req.params.new_priority;

  async.parallel([beforeupdate,afterupdate ],function(err,result){
    console.log(result);
    if(err)return res.status(403).send('update middleware configuaration error');
    return res.status(200).send("update success");

  })
   function beforeupdate(callback) {
     MW_before.update({
       service_name: service_name,
       mw_name: mw_name
     }, {$set: {"priority": new_priority}}, function (err, middlewares) {
       console.log("before list", middlewares);
       if (err)
         return callback(err);
       return callback(null);
     });
   }
  function afterupdate(callback){
  MW_after.update({service_name: service_name,mw_name:mw_name},{$set:{"priority":new_priority}}, function(err, middlewares) {
    console.log("after list",middlewares);
    if (err)
      return callback(err);
     return callback(null);
  });
  }

});

var server = app.listen(7777, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Business service listening at http://%s:%s', host, port);

});