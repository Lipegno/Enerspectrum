var express = require('express'),
    path = require('path'),
    request = require('request'),
    bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'demo')));

// Proxy /api requests to localhost:3000
// TODO: Remove this. We'll have a proxy that will do this for us
app.get('/api*', function (req, res) {
    console.log('Proxying to :3000');
    var url = 'http://localhost:3000' + req.originalUrl;

    request(url, function (err, response, body) {
        res.status(response.statusCode).send(body);
    });
});

app.post('/api*', function (req, res) {
    console.log('Proxying POST to :3000');
    var url = 'http://localhost:3000' + req.originalUrl;
    request({
        url: url,
        method: "POST",
        json: true,
        headers: {
            "Content-type": "application/json",
        },
        body: req.body
    }, function (err, response, body) {
        res.status(response.statusCode).send(body);
    })
});

// TODO: make this listen to the port requested by the parent
var server = app.listen(3001, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('API app listening at http://%s:%s', host, port);
});