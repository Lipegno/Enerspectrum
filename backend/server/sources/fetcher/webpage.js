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
		
		var frequency = {
			'minutesOffset': params.minutesOffset,
			'minutesInterval': params.minutesInterval
		};
		
		var capturedThis = this;
		taskqueue.schedule(frequency, this.name, function(done) { capturedThis.run(done); });
	} else {
		return new WebpageFetcher(name, params);
	}
}

util.inherits(WebpageFetcher, EventEmitter);

WebpageFetcher.prototype.run = function(done) {
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
		} else {
			if (response.statusCode == 200) {
				var $ = cheerio.load(html);
				var elementText = $(selector).map(function() { return $(this).text(); });
				var elementTextArray = [];
				for (var i = 0; i < elementText.length; i++) {
					elementTextArray.push(elementText[i]);
				}
				
				outerThis.emit("dataReceived", elementTextArray);
			} else {
				console.log("Error %s got %s status code for page %s", name, response.statusCode.toString(), url);
				outerThis.emit("fetchError", {statusCode: response.statusCode});
			}
		}
		
		if (done) {
			done();
		}
	});
};

module.exports = WebpageFetcher;