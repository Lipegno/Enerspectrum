var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
	
var sampleSchema = Schema({
	timestamp: Date,
	source: Schema.ObjectId,
	data: {}
});

var Sample = mongoose.model('Sample', sampleSchema);
module.exports = Sample;