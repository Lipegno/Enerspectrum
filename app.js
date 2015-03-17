var recluster = require('recluster'),
	npid = require('npid',
	path = require('path'),
	_ = require('underscore');

function loadConfig() {
	var config = require(path.join(__dirname, 'conf/config.json'));
	switch (process.env.NODE_ENV) {
		case "dev":
			var site_config = path.join(__dirname, 'conf/dev.config.json');
			break;
		case "prod":
			var site_config = path.join(__dirname, 'conf/prod.config.json');
			break;
	}
	
	if (site_config) {
		try {
			var site_config_settings = require(site_config);
			_.extend(config, site_config_settings);
		} catch (e) {
			console.log("Could not load site-specific settings. Using defaults.");
		}
	}
	
	return config;
}

var pid = npid.create('./cluster_main.pid');
pid.removeOnExit();

var config = loadConfig();

var serverCluster = recluster(path.join(__dirname, 'server/app.js'), {workers: config.server.workerCount, args: config.server.workerArgs});
var webCluster = recluster(path.join(__dirname, 'web/app.js'), {workers: config.web.workerCount, args: config.web.workerArgs});

process.on('SIGHUP', function() {
    console.log('Got SIGHUP, reloading cluster...');
    serverCluster.reload();
	webCluster.reload();
});

console.log("Starting clusters...");
serverCluster.run();
webCluster.run();
console.log("Clusters running.");