var webScraper = require('./webScraper.js');
var jsonListener = require('./jsonListener.js');

var sources = {
	'webScraper': webScraper,
	'jsonListener': jsonListener
};

function create(name, config, callback) {
	if (!name in sources) {
		callback('Source ' + name + ' does not exist');
		return;
	}
	
	var sourceType = sources[name];
	sourceType[name].create(config, callback);
}

exports.create = create;