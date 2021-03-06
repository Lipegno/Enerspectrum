var express = require('express'),
    _ = require('underscore'),
    passport = require('passport'),
    sampleConverter = require('./sampleConverter.js');

var router = express.Router();

// TODO: Storing this per-process means that there's a race
// condition in slug creation.
var slugs = {};

function slugify(str) {
	var slug = str.toLowerCase().replace(/\s+/g, '-');
	while (slug in slugs) {
		slug = slug + 'x';
	}
	
	slugs[slug] = str;
	
	return slug;
}

function jsonListener(storage, config) {
	this.type = 'jsonListener';
	this.name = config.name;
	this.config = config;
	this.storage = storage;
    this.converter = new sampleConverter(config.converter);
    this.producerRequired = config.producerRequired;
	
	var self = this;
	
    router.post('/json/' + config.slug,
        (this.config.producerRequired) ? passport.authenticate('device', {session: false}) : function (req, res, next) { return next(); },
        function (req, res) {
            if (Array.isArray(req.body)) {
                var data = req.body;
            } else {
                var data = [req.body];
            }
        
            var convertedData = _.map(data, function (d) { return self.converter.convert(d); });

            if (convertedData[0].timestamp) {
                var timestamps = _.map(_.pluck(convertedData, 'timestamp'), function (t) { return t.toDate(); });
            } else {
                var now = new Date();
                var timestamps = _.map(new Array(convertedData.length), function () { return now; });
            }

        storage.writeSamples(self.name, req.user ? req.user.producer.id : null, req.user ? req.user.device.name : null, timestamps, convertedData,
                function (err, result) {
                    if (err) {
                        res.send("Error");
                        return;
                    }
            
                    console.log(result);    

                    res.send({ 'rows': result.length });
                });
	    });
	
	console.log('jsonListener listening on ' + '/json/' + config.slug);
}

function create(storage, config, callback) {
	try {
		if (!config.slug) {
			config.slug = slugify(config.name);
		}
		
		var listener = new jsonListener(storage, config);
	} catch (err) {
		console.log("Error creating json listener " + err);
		callback(err);
		return;
	}
	
	callback(null, listener);
}

exports.create = create;
exports.router = router;
exports.params = {
	'name': { type: 'string', required: true},
	'producerRequired': {type: 'integer', required: false, defaultValue: true},
	'converter': { type: 'object', required: true}
};