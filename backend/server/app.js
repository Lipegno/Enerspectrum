var express = require('express'),
    sources = require('./sources'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    session = require('express-session'),
    RedisStore = require('connect-redis')(session),
    auth = require('./auth'),
	bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());
app.use(session({
    secret: "8675309", 
    store : new RedisStore(),
    cookie : {
        maxAge : 604800 // one week
    }
}));

app.use(passport.initialize());
app.use(passport.session());

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
app.use('/auth', auth.router);

var port = process.argv[2] || 3000;
var server = app.listen(port, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('API app listening at http://%s:%s', host, port);
});
