var express = require('express'),
    sources = require('./sources'),
    mongoose = require('mongoose'),
	bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());

mongoose.connect('localhost', 'enerspectrumMetadata', function (err) {
    if (err) {
        console.log(err);
    }
});

sources.connectToStorage("mongodb://localhost:27017/enerspectrumSamples", function (err) {
    if (err) {
        console.log(err);
    }
});

sources.prepareSources();
app.use('/api', sources.router);

// TODO: make this listen to the port requested by the parent
var server = app.listen(3000, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('API app listening at http://%s:%s', host, port);
});