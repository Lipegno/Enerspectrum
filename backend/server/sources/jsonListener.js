var express = require('express');
var sampleConverter = require('./sampleConverter.js');
var router = express.Router();

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
	
	var self = this;
	
	router.post('/json/' + config.slug, function(req, res) {
		console.log(req.body);
		var convertedData = self.converter.convert(req.body);
		console.log(convertedData);
		storage.writeSample(self.id, null, convertedData);
		res.send('wut');
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
	'producerRequired': {type: 'integer', required: false},
	'converter': { type: 'object', required: true}
};