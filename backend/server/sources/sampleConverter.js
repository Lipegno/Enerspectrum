var converter = require('./converter');

function identity(value) {
	return value;
}

function createElementConverter(params) {
	if (!converter[params.type]) {
		return identity;
	}
	
	return converter[params.type](params.typeParams);
}

function sampleConverter(params) {
	this.elementConverters = {};
	
	for (key in params) {
		this.elementConverters[key] = createElementConverter(params[key]);
	}
}

sampleConverter.prototype.convert = function(sample) {
	output = {};
	for (ecName in this.elementConverters) {
		output[ecName] = this.elementConverters[ecName](sample[ecName]);
	}
	
	return output
};

module.exports = sampleConverter;