var _ = require('underscore');

function integer(params) {
	params = params || {};
	params.thousandsSeparator = params.thousandsSeparator || "";
	
	return function(data) {
		// We only handle using . or , as the thousands separator.
		// We may want to think about allowing spaces for instance as well.
		if (params.thousandsSeparator == '.') {
			data = data.replace(/\./g, '');
		} else if (params.thousandsSeparator == ',') {
			data = data.replace(/,/g, '');
		}
		
		var tryParse = Number(data);
		
		if (!isNaN(tryParse) && Number.isInteger(tryParse)) {
			return tryParse;
		}
		
		return NaN;
	};
}

function checkForFloatingPoint(data) {
	var tryParse = Number(data);
	if (!isNaN(tryParse)) {
		// We got a number, but it could be floating point.
		var indexOfSeparator = data.indexOf('.');
		if (indexOfSeparator == -1) {
			// No separator. We must be an integer.
			return 1.0;
		} else if (indexOfSeparator == data.length - 4) {
			// This could be a European-style integer, using '.' as a separator.
			// We can't really tell if it is or not, so return a probability that
			// it might be an integer.
			return 0.7;
		} else {
			// The separator exists, but isn't in the right place to be a thousands
			// separator. If we still are an integer, return a small probability, else 0.
			if (Number.isInteger(tryParse)) {
				return 0.1;
			}
			
			return 0.0;
		}
	}
	
	return -1.0;
}

integer.getProbability = function(data) {
	var initialParseResult = checkForFloatingPoint(data);

	if (initialParseResult >= 0.0) {
		return initialParseResult;
	}
	
	// JS couldn't parse this as an integer, but it could still be one, if it's written
	// in a human-friendly format e.g. 1,000,000 or 1.000.000. Let's try to see if this
	// is the case.
	if (data.indexOf('.') != -1 && data.indexOf(',') != -1) {
		// Uh-oh. We have both . and , in the string. This means we're probably not an
		// integer, but let's see if parsing it as a float works, and if it does, return
		// a low probability.
		
		// Whichever comes first, we'll treat as a thousands separator.
		if (data.indexOf('.') < data.indexOf(',')) {
			data = data.replace(/\./g, '');
			data = data.replace(',', '.');
		} else {
			data = data.replace(/,/g, '');
		}
		
		return 0.3 * Math.max(checkForFloatingPoint(data), 0.0);
	}
	
	if (data.indexOf('.') != -1) {
		var splitData = data.split('.');
		if (splitData.length > 2) {
			var maxProb = 1.0;
		} else {
			var maxProb = 0.85;
		}
		
		if (_.every(splitData.slice(1), function(i) { return i.length == 3; })) {
			return Math.min(Math.max(checkForFloatingPoint(data.replace(/\./g, '')), 0.0), maxProb);
		}
	} else if (data.indexOf(',') != -1) {
		var splitData = data.split(',');
		if (splitData.length > 2) {
			var maxProb = 1.0;
		} else {
			var maxProb = 0.85;
		}
		
		if (_.every(splitData.slice(1), function(i) { return i.length == 3; })) {
			return Math.min(Math.max(checkForFloatingPoint(data.replace(/,/g, '')), 0.0), maxProb);
		}
	}
	
	// This data must just be a straight-up string.
	return 0.0;
};

integer.weight = 1.0;
integer.name = "integer";

module.exports = integer;