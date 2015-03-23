var cheerio = require('cheerio');
var request = require('request');
var util = require('util');
var taskqueue = require('../../taskqueue');
var EventEmitter = require('events').EventEmitter;

function WebpageFetcher(name, params) {
	if (this instanceof WebpageFetcher) {
		this.name = name;
		this.url = params.url;
		this.selector = params.selector;
		if (params.username && params.password) {
			this.auth = {
				username: params.username,
				password: params.password
			};
		}
		
		var capturedThis = this;
		taskqueue.schedule(params.frequency, function() { capturedThis.run(); });
	} else {
		return new WebpageFetcher(name, params);
	}
}

util.inherits(WebpageFetcher, EventEmitter);

WebpageFetcher.prototype.run = function() {
	var options = {url: this.url};
	if (this.auth) {
		options.auth = this.auth;
	}
	
	var selector = this.selector;
	var name = this.name;
	var url = this.url;
	var outerThis = this;
	
	request.get(options, function(err, response, html) {
		if (err) {
			console.log("Error %s fetching page %s", name, url);
			outerThis.emit("fetchError");
		}
		
		if (response.statusCode == 200) {
			var $ = cheerio.load(html);
			outerThis.emit("dataReceived", $(selector).text());
		} else {
			console.log("Error %s got %s status code for page %s", name, response.statusCode.toString(), url);
			outerThis.emit("fetchError", {statusCode: response.statusCode});
		}
	});
};

module.exports = WebpageFetcher;