function floatingPoint(params) {
	// Default to european-style.
	params = params || {};
	params.thousandsSeparator = params.thousandsSeparator || '';
	params.decimalSeparator = params.decimalSeparator || (params.thousandsSeparator=='.' ? ',' : '.');
	
	return function(data) {
		// We only handle . and , currently. We may want to expand this in the future
		switch (params.thousandsSeparator) {
			case '.':
				data = data.replace(/\./g, '');
				break;
			case ',':
				data = data.replace(/,/g, '');
				break;
		}
		
		if (params.decimalSeparator != '.' && data.indexOf('.') != -1) {
			return NaN;
		}
		
		if (params.decimalSeparator == ',') {
			data = data.replace(',', '.');
		}
		
		return Number(data);
	};
}

floatingPoint.getProbability = function(data) {
	var tryParse = Number(data);
	if (!isNaN(tryParse)) {
		// The data is a number. If we're not an integer, we're definitely floating point.
		if (!Number.isInteger(tryParse)) {
			return 1.0;
		}
		
		return 0.9;
	}
	
	// Try to detect thousands seperators and decimal separators.
	if (data.indexOf('.') != -1 && data.indexOf(',') != -1) {
		// We have both . and , in the string. This means there's a decent chance
		// that we're a floating point number. Let's try to parse and find out.
		
		// Whichever comes first, we'll treat as a thousands separator.
		// Note that we're not checking if we're correctly grouping into 3's.
		// This means that we could detect things like 02.04.14 as a floating point
		// even though it's more likely to be a date.
		if (data.indexOf('.') < data.indexOf(',')) {
			data = data.replace(/\./g, '');
			data = data.replace(',', '.');
		} else {
			data = data.replace(/,/g, '');
		}
		
		if (!isNaN(Number(data))) {
			return 1.0
		}
		
		return 0.0;
	}
	
	// Otherwise, let's treat the existing symbol as a decimal point and see
	// if we can parse. If we can, great. If we can't, we're not floating point.
	if (!isNaN(Number(data.replace(/\.|,/, '')))) {
		return 0.9;
	}
	
	return 0.0;
};

floatingPoint.name = "floatingPoint";
floatingPoint.weight = 1.0;

module.exports = floatingPoint;