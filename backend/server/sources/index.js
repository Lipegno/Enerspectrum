var express = require('express'),
    _ = require('underscore'),
    async = require('async'),
    models = require('../models'),
    query = require('./query'),
    converter = require('./converter'),
    storage = require('./storage'),
	webScraper = require('./webScraper.js'),
	jsonListener = require('./jsonListener.js');

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
	sourceType.create(storage, config, callback);
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

router.get('/source/:source_name', function (req, res) {
    var q = JSON.parse(req.query.q);
    if (!q) {
        q = [
            { '$sort': ['-timestamp'] },
            { '$limit': 250 }
        ];
    }
    
    var source_name = req.params.source_name;
    
    if (!source_name) {
        res.status(404).send('source not found');
        return;
    }
    
    function sourcesReady(err) {
        if (err) {
            res.status(500).send('error finding source');
            return;
        }

        if (!(source_name in sources)) {
            res.status(404).send('source not found');
            return;
        }

        query.execute(null, sources[source_name], q, function (err, result) {
            if (err) {
                res.status(500).send('error querying source');
                return;
            }
            
            res.json(result);
        });
    }

    if (!(source_name in sources)) {
        refreshSources(sourcesReady);
    } else {
        sourcesReady();
    }
});

router.use(jsonListener.router);

function prepareSource(sourceData, callback) {
    create(sourceData.type, sourceData.config, function (err, response) {
        if (err) {
            callback(err);
            return;
        }

        sources[sourceData.config.name] = response;
        callback(null, response);
    });
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
        storage.initializeCollection(source.name, !!(source.producerRequired));
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

function refreshSources(callback) {
    models.Source.find({}, function (error, sourceList) {
        if (error) {
            callback(error);
            return;
        }
        
        sourceList = _.filter(sourceList, function (x) { return !(x.name in sources); });
        async.map(sourceList, prepareSource, callback);
    });
}

function connectToStorage(connectionString, callback) {
    storage.connect(connectionString, callback);
}

exports.prepareSources = prepareSources;
exports.router = router;
exports.connectToStorage = connectToStorage;