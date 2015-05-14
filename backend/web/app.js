var express = require('express');
var path = require('path');
var request = require('request');

var app = express();
app.use(express.static(path.join(__dirname, 'demo')));

// Proxy /api requests to localhost:3000
// TODO: Remove this. We'll have a proxy that will do this for us
app.get('/api*', function (req, res) {
    console.log('Proxying to :3000');
    var url = 'http://localhost:3000' + req.originalUrl;

    request(url, function (err, response, body) {
        res.send(body);
    });
});

app.post('/api*', function (req, res) {
    console.log('Proxying to :3000');
});

// TODO: make this listen to the port requested by the parent
var server = app.listen(3001, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('API app listening at http://%s:%s', host, port);
});