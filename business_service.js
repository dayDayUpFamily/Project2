var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('Business service!');
});

var server = app.listen(8888, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Business service listening at http://%s:%s', host, port);

});