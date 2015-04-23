var redis = require('redis'),
	client = redis.createClient(),
	uuid = require('node-uuid'),
	moment = require('moment');

// Currently using redis for the timing events. This could be changed to something like RabbitMQ later if we need.
// TODO: Currently we allow events to be lost if a process crashes or takes too long. We'll need to rethink this
// if we have events that must be reliably delivered.
var callbacks = {};
var subscriber = redis.createClient();
var clientId = uuid.v4();
var eagerness = 50;

subscriber.on("message", function(channel, key) {
	var id = key.split(":")[2];
	console.log("Key expired %s with id %s", key, id);
	if (id in callbacks) {
		if (eagerness > 0) {
			eagerness -= 1;
		}
		
		tryExecuteCallback(id);
	}
});

subscriber.subscribe("__keyevent@0__:expired", function(err, reply) {
	if (err) {
		console.log("Error subscribing. Is redis down?");
	}
});

function calculateNextExpiration(interval) {
	var now = moment();
	var lastMidnight = now.clone().startOf('day');
	var secondsOffset = interval.offset * 60;
	var secondsInterval = interval.interval * 60;
	var currentSeconds = moment.duration(now.diff(lastMidnight)).asSeconds();
	if (currentSeconds < secondsOffset) {
		var secondsFromMidnight = secondsOffset;
		var secondsFromNow = Math.ceil(secondsOffset - currentSeconds);
	} else {
		currentSeconds -= secondsOffset;
		var secondsFromMidnight = secondsInterval * Math.ceil(currentSeconds / secondsInterval);
		var secondsFromNow = Math.ceil(secondsFromMidnight - currentSeconds);
	}
	
	return {
		secondsFromNow: secondsFromNow,
		tolerance: secondsFromNow + Math.floor(currentSeconds) - secondsInterval / 4
	};
}

function tryExecuteCallback(id) {
	var callback = callbacks[id];
	setTimeout(function() {
		console.log("Ready to execute callback");
		callback(id);
	}, eagerness);
}

function unschedule(id) {
	if (id in callbacks) {
		delete callbacks[id];
	}
}

function setNextEvent(interval, id, done) {
	var seconds = calculateNextExpiration(interval);
	client.mset("taskqueue:tolerance:" + id, seconds.tolerance,
			  "taskqueue:timer:" + id, seconds.secondsFromNow,
	function(err, replies) {
		if (err) {
			// TODO: Bubble up error
			console.log("Unable to schedule event...is redis down?");
		} else {
		
			// We're the first one to set the key, so we're in charge of setting up its expiration.
			client.expire("taskqueue:timer:" + id, seconds.secondsFromNow, function(err, reply) {
				if (err || !reply) {
					// TODO: Communicate error
					console.log(err);
					console.log("Unable to expire key...is redis down?");
					return;
				}
			});
		}
		
		if (done) {
			done();
		}
	});
}

function schedule(interval, id, callback) {
	callbacks[id] = makeWrappedCallback(id, callback);
	client.setnx("taskqueue:interval:" + id, JSON.stringify(interval), function(err, reply) {
		if (err) {
			console.log("Couldn't set interval for item %s. Is redis down?", id);
			return;
		}
		
		if (reply) {
			setNextEvent(interval, id);
		} else {
			console.log("Taskqueue: client %s key already set %s", clientId, id);
		}
	});
}

function markStarted(id, done) {
	console.log("Locking %s", id);
	client.setnx("taskqueue:lock:" + id, clientId, function(err, reply) {
		if (err) {
			console.log("Error in client %s acquiring lock for item %s", clientId, id);
			return;
		}
		
		if (reply) {
			console.log("Acquired lock in client %s for item %s", clientId, id);
			client.get("taskqueue:tolerance:" + id, function(err, reply) {
				if (err) {
					console.log("Error checking next time for item %s in client %s", id, clientId);
					return;
				}
				
				eagerness = 50;
				var currentSeconds = moment.duration(moment().subtract(moment().startOf('day'))).asSeconds();
				if (currentSeconds > reply) {
					done();
				} else {
					console.log("Lock spuriously acquired by client %s for id %s: ignoring", clientId, id);
				}
			});
		}
	});
}

function markCompleted(id) {
	client.get("taskqueue:interval:" + id, function(err, reply) {
		if (err) {
			console.log("Error: Couldn't get next interval for %s", id);
			return;
		}
		
		var interval = JSON.parse(reply);
		setNextEvent(interval, id, function() {
			client.del("taskqueue:lock:" + id, function(err, reply) {
				if (err) {
					console.log("Error in client %s couldn't unlock item %s", clientId, id);
				}
			});
		});
	});
}

function makeWrappedCallback(id, callback) {
	return function() {
		markStarted(id, function() {
			callback();
			markCompleted(id);
		});
	};
}

exports.schedule = function(interval, id, callback) {
	if (id in callbacks) {
		// Ignore requests to schedule callbacks that we've already
		// scheduled. If the user wants to change the frequency, they should
		// call reschedule
		return;
	}
	
	schedule(interval, id, callback);
};

exports.reschedule = function(interval, id, callback) {
	if (id in callbacks) {
		unschedule(id);
	}
	
	schedule(interval, id, callback);
};

exports.unschedule = function(id) {
	// Note that this will unschedule for other processes as well that share the same id.
	unschedule(id);
};

console.log("Taskqueue client %s listening", clientId);
