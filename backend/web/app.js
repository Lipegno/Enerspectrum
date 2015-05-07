var express = require('express');
var path = require('path');

var app = express();
app.use(express.static(path.join(__dirname, 'demo')));

// TODO: make this listen to the port requested by the parent
var server = app.listen(3001, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('API app listening at http://%s:%s', host, port);
});