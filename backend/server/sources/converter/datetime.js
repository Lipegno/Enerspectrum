var moment = require('moment');

function datetime(params) {
	params = params || {};
	params.format = params.format || "YYYY-MM-DD HH:mm:ss";
	
	return function(data) {
		var result = moment(data, params.format);
		if (result.isValid()) {
			return result;
		}
		
		return 0;
	};
}

function combineDateTime(dates, times, separators) {
	var formats = [];
	for (var i = 0; i < times.length; i++) {
		formats.push(times[i]);
	}
	
	for (var i = 0; i < dates.length; i++) {
		formats.push(dates[i]);
		for (var j = 0; j < times.length; j++) {
			for (var k = 0; k < separators.length; k++) {
				formats.push(dates[i] + separators[k] + times[j]);
			}
		}
	}
	
	return formats;
}

var dateFormats = [
	"YYYY-MM-DD",
	"YYYY/MM/DD",
	"DD-MM-YYYY",
	"DD/MM/YYYY",
	"MM-DD-YYYY",
	"MM/DD/YYYY",
	"YY-MM-DD",
	"YY/MM/DD",
	"DD-MM-YY",
	"DD/MM/YY",
	"MM-DD-YY",
	"MM/DD/YY"
];

var timeFormats = [
	"HH:mm:ss",
	"hh:mm:ss",
	"HH:mm",
	"hh:mm"
];

var formats = combineDateTime(dateFormats, timeFormats, ['T', ' ']);

datetime.getProbability = function(data) {
	// We'll just try several different formats.
	// If one works, return 1.0. If none do, return 0.0.
	if (moment(data, formats, true).isValid()) {
		return 1.0;
	}
	
	return 0.0;
}

datetime.name = "datetime";
datetime.weight = 0.8;

module.exports = datetime;