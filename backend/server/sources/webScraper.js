var webpageFetcher = require('./fetcher').webpage;

function webScraper(config) {
	this.fetcher = new webpageFetcher(config.name, config);
	this.config = config;
	this.type = 'webScraper';
}

function create(config, callback) {
	try {
		var scraper = new webScraper(config);
	} catch (err) {
		callback(err);
	}
	
	callback(null, scraper);
}

exports.create = create;

exports.params = {
	'name': { type: 'string', required: true},
	'url': { type: 'string', required: true},
	'selector': { type: 'string', required: true},
	'frequency': { type: 'integer', defaultValue: 15},
	'username': { type: 'string', required: false},
	'password': { type: 'string', meta: 'password', required: false}
};