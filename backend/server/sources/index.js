var express = require('express'),
	_ = require('underscore'),
	async = require('async'),
	models = require('../models'),
	converter = require('./converter'),
	webScraper = require('./webScraper.js'),
	jsonListener = require('./jsonListener.js'),
	storage = require('./storage');

var router = express.Router();

var schemas = {
	'webScraper': webScraper,
	'jsonListener': jsonListener
};

var sources = {};

function create(name, config, callback) {
	if (!schemas[name]) {
		callback('Source schema ' + name + ' does not exist');
		return;
	}
	
	var sourceType = schemas[name];
	sourceType.create(storage.MongoStorage, config, callback);
}

function validateConfig(schema, config) {
	var params = schema.params;
	var config = config || {};
	for (key in params) {
		if (params[key].required && !config[key]) {
			console.log(key);
			return false;
		}
		
		if (!config[key] && params[key].defaultValue) {
			config[key] = params[key].defaultValue;
		} else if (config[key]) {
			// TODO: May want to add the ability to pass parameters to the converter
			// TODO: Need to verify data.
			var conv = converter[params[key].type]();
			config[key] = conv(config[key]);
		}
	}
	
	return true;
}

router.get('/source_schema', function(req, res) {
	res.json(_.keys(schemas));
});

router.get('/source_schema/:schema_name', function(req, res) {
	if (!schemas[req.params.schema_name]) {
		res.status(404).send('Source not found');
		return;
	}
	
	res.json(schemas[req.params.schema_name].params);
});

router.post('/source_schema/:schema_name/create', function(req, res) {
	if (!schemas[req.params.schema_name]) {
		res.status(404).send('Source not found');
		return;
	}
	
	schema = schemas[req.params.schema_name];
	if (!validateConfig(schema, req.body)) {
		res.status(400).send('Invalid configuration');
		return;
	}
	
	create(req.params.schema_name, req.body, function(error, source) {
		if (error) {
			console.log(error);
			res.status(500).send("Error creating source");
			return;
		}
		
		saveSource(source, function(error, saved_source) {
			if (error) {
				res.status(500).send("Error saving new source");
				return;
			}
			
			res.json({'id': saved_source.id});
		});
	});
});

router.get('/source', function(req, res) {
	
});

router.get('/source/:source_id', function(req, res) {
	
});

router.get('/source/:source_id/producer/:producer_id', function(req, res) {
});

router.get('/source/:source_id/sample', function(req, res) {
});

router.get('/source/:source_id/producer/:producer_id/sample', function(req, res) {
});

router.use(jsonListener.router);

function prepareSource(sourceData, callback) {
	create(sourceData.type, sourceData.config, callback);
}

function saveSource(source, callback) {
	var modelSource = models.Source({type: source.type, config: source.config});
	console.log("SAVING");
	modelSource.save(function(err, modelSource) {
		console.log("Save complete");
		if (err) {
			callback(err);
			return;
		}
		
		source.id = modelSource.id;
		callback(null, source);
	});
}

function prepareSources(callback) {
	models.Source.find({}, function(error, sources) {
		if (error) {
			callback(error);
			return;
		}
		
		async.map(sources, prepareSource, callback);
	});
};

exports.prepareSources = prepareSources;
exports.router = router;