var express = require('express');
var app = express();
var MW_before = require('./models/MW_before');
var MW_after = require('./models/MW_after');
var beforeList = [];
var afterList = [];
var mongoose = require("mongoose");

mongoose.connect('mongodb://krist:krist@ds059471.mongolab.com:59471/express-test');

function configurableMiddleWare(req, res, next) {
  console.log(9);
  console.log(beforeList);
}

app.get('/mwlist/:biz_name', function (req, res) {
  beforeList = [];
  afterList = [];
  // console.log(req.params.biz_name);
  MW_before.find({service_name: req.params.biz_name}, function(err, middlewares) {
    // console.log(middlewares);
    if (err)
      return res.status(403).send('query middleware configuaration error');
    else
    {
      // console.log(19);
      for(i = 0; i < middlewares.length; i++)
        beforeList.push(middlewares[i].mw_name);
      // return res.send(beforeList);
    }
  });
  // console.log(25);
  MW_after.find({service_name: req.params.biz_name}, function(err, middlewares) {
    if (err)
      return res.status(403).send('query middleware configuaration error');
    else
    {
      for(i = 0; i < middlewares.length; i++)
        afterList.push(middlewares[i].mw_name);
      // return res.send("beforeList:"+beforeList+"\n"+"afterList:"+afterList+"\n");
    }
  });
  // res.send(beforeList);
  // console.log(37);
});

app.put('/mwlist/:biz_name/:mw_name/:new_priority', function (req, res) {

});

var server = app.listen(7777, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Business service listening at http://%s:%s', host, port);

});