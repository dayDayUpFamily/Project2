var User = require('./models/User');
var jwt = require('jwt-simple');
 
module.exports = function(req, res, next) {
	var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
	
};