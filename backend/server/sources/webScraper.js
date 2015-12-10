var webpageFetcher = require('./fetcher').webpage;
var moment = require('moment');
var sampleConverter = require('./sampleConverter.js');

function webScraper(storage, config) {
	this.fetcher = new webpageFetcher(config.name, config);
	this.name = config.name;
	this.config = config;
	this.storage = storage;
	this.type = 'webScraper';
	this.converter = new sampleConverter(config.converter);
	
	this.fetcher.on('dataReceived', function(data) {
		console.log("Data received " + config.name);
		console.log(data);
		console.log(this);
		var convertedData = this.converter.convert(data);
        console.log(convertedData);
        if (convertedData.timestamp) {
            var timestamp = convertedData.timestamp;
        } else {
            var timestamp = moment();
        }
        
        timestamp = timestamp.toDate();

		storage.writeSample(this.name, null, null, timestamp, convertedData);
	}.bind(this));
}

function create(storage, config, callback) {
	try {
		console.log("creating webscraper "+JSON.stringify(config,false,3));
		var scraper = new webScraper(storage, config);
	} catch (err) {
		console.log("Error creating webscraper " + err);
		callback(err);
		return;
	}
	
	callback(null, scraper);
}

exports.create = create;

exports.params = {
	'name': { type: 'string', required: true},
	'url': { type: 'string', required: true},
	'selector': { type: 'string', required: true},
	'minutesInterval': { type: 'integer', defaultValue: 15},
	'minutesOffset': { type: 'integer', defaultValue: 3},
	'username': { type: 'string', required: false},
	'password': { type: 'string', meta: 'password', required: false},
	'converter': { type: 'object', required: true}
};