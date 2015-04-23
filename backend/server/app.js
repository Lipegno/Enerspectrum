var express = require('express'),
	mongoose = require('mongoose'),
	sources = require('./sources'),
	bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());

mongoose.connect('localhost', 'testdb');

sources.prepareSources();
app.use('/api', sources.router);

// TODO: make this listen to the port requested by the parent
var server = app.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('API app listening at http://%s:%s', host, port);
});