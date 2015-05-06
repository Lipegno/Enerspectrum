var moment = require('moment'),
    models = require('../models');

var MongoStorage = {};

MongoStorage.writeSample = function(sourceId, producerId, sampleData) {
	var sample = models.Sample();
	sample.source = sourceId;
	if (producerId) {
		sample.producer = producerId;
	}
	
	sample.data = sampleData;
	sample.timestamp = moment();
	
	sample.save(function(err, savedSample) {
		if (err) {
			console.log('Error saving sample ' + sourceId);
			return;
		}
		
		console.log('Sample saved');
	});
};

exports.MongoStorage = MongoStorage;
