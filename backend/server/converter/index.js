var _ = require('underscore');

exports.datetime = require('./datetime.js');
exports.integer = require('./integer.js');
exports.floatingPoint = require('./floatingPoint.js');
exports.string = require('./string.js');

function getType(data) {
	var possibilities = [];
	for (var name in exports) {
		var conv = exports[name];
		if (conv.getProbability  && conv.weight) {
			possibilities.push(
				{
					converter: conv,
					weightedProbability: conv.weight * conv.getProbability(data)
				});
		}
	}
	
	possibilities = _.sortBy(possibilities, 'weightedProbability');
	var bestLikelihood = possibilities[possibilities.length - 1];
	
	if (bestLikelihood.weightedProbability > 0) {
		return bestLikelihood.converter;
	}
	
	return null;
}

exports.getType = getType;