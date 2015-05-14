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
        this.elementConverters[key] = {
            'name': params[key].name || key,
            'converter': createElementConverter(params[key])
        };
	}
}

sampleConverter.prototype.convert = function(sample) {
	output = {};
    for (ecName in this.elementConverters) {
        var outName = this.elementConverters[ecName]['name'] || ecName;
		output[outName] = this.elementConverters[ecName]['converter'](sample[ecName]);
    }

	return output
};

module.exports = sampleConverter;