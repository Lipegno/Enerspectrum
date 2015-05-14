var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
	
var sourceSchema = Schema({
	type: String,
	config: {}
});

var Source = mongoose.model('Source', sourceSchema);
module.exports = Source;