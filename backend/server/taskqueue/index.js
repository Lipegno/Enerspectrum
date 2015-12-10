var redis = require('redis'),
	client = redis.createClient(),
	uuid = require('node-uuid'),
	_ = require('underscore'),
	async = require('async'),
	moment = require('moment');

// Currently using redis for the timing events. This could be changed to something like RabbitMQ later if we need.
// TODO: Currently we allow events to be lost if a process crashes or takes too long. We'll need to rethink this
// if we have events that must be reliably delivered.
// TODO: The locking method this uses is somewhat antiquated. Redis suggests the Redlock algorithm instead.
var callbacks = {};
var subscriber = redis.createClient();
var clientId = uuid.v4();
var eagerness = 50;
var lockTimeout = 300;
var SECONDS_PER_DAY = 60 * 60 * 24;

function watchdog(interval, variance) {
	this.unscheduledCallbacks = {};
	this.interval = interval;
	this.variance = variance;
	
	this.check();
}

function idUnscheduled(id, callback) {
	client.ttl('taskqueue:timer:' + id, function(err, reply) {
		if (err) {
			console.log("Error checking ttl for " + id);
			callback(err);
			return;
		}
		
		if (reply < 0) {
			// The id isn't scheduled, but it could be because it's currently running.
			// Check the lock.
			client.exists('taskqueue:lock:' + id, function(err, reply) {
				if (err) {
					console.log("Error checking lock for id " + id);
					callback(err);
					return;
				}
				
				if (reply) {
					console.log(id + ' locked from watchdog');
					console.log("Expiring lock for " + id + " from watchdog.");
					client.expire("taskqueue:lock:" + id, lockTimeout, function(err, reply) {
						if (err) {
							console.log("Couldn't expire lock. Is redis down?");
							return;
						}
					});
					
					callback(null, false);
				} else {
					console.log(id + ' unscheduled from watchdog');
					callback(null, true);
				}
			});
		} else {
			console.log(id + ' scheduled from watchdog');
			callback(null, false);
		}
	});
};

watchdog.prototype.check = function() {
	console.log("Watchdog awake...checking");
	var ids = _.keys(callbacks);
	console.log(callbacks);
	async.map(ids, idUnscheduled, function(err, results) {
		if (err) {
			console.log("Error checking for unscheduled ids in watchdog.");
			return;
		}
		
		console.log(results);
		
		for (var i = 0; i < results.length; i++) {
			if (results[i]) {
				if (ids[i] in this.unscheduledCallbacks) {
					console.log("Seen " + ids[i] + " unscheduled twice. Rescheduling. Does the callback crash?");
					delete this.unscheduledCallbacks[ids[i]];
					markCompleted(ids[i]);
				} else {
					console.log("Watchdog seeing unscheduled " + ids[i]);
					this.unscheduledCallbacks[ids[i]] = true;
				}
			} else if (ids[i] in this.unscheduledCallbacks) {
				console.log("Previously unscheduled " + ids[i] + " rescheduled");
				delete this.unscheduledCallbacks[ids[i]];
			}
		}
	}.bind(this));
	this.schedule();
};

watchdog.prototype.schedule = function() {
	var waitTime = this.interval + Math.floor(this.variance * Math.random());
	console.log("Watchdog sleeping for " + waitTime);
	setTimeout(this.check.bind(this), waitTime * 1000);
};

subscriber.on("message", function(channel, key) {
	var id = key.split(":")[2];
	var type = key.split(":")[1];
	console.log("Key expired %s with id %s", key, id);
	
	if (type == 'timer') {
		if (id in callbacks) {
			if (eagerness > 0) {
				eagerness -= 1;
			}
			
			tryExecuteCallback(id);
		}
	} else if (type == 'lock') {
		// Here's the case where the client processing the item failed.
		// We need to set the next interval ourselves.
		// There is a possiblity that multiple clients try to do this.
		// This shouldn't harm anything--they'll all calculate the same time 
		// for the interval.
		console.log("Lock expired for id " + id);
		console.log("Did a client crash?");
		markCompleted(id);
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
	var secondsOffset = interval.minutesOffset * 60;
	var secondsInterval = interval.minutesInterval * 60;
	var currentSeconds = moment.duration(now.diff(lastMidnight)).asSeconds();
	if (currentSeconds < secondsOffset) {
		var secondsFromMidnight = secondsOffset;
		var secondsFromNow = Math.ceil(secondsOffset - currentSeconds);
	} else {
		currentSeconds -= secondsOffset;
		var secondsFromMidnight = secondsInterval * Math.ceil(currentSeconds / secondsInterval);
		var secondsFromNow = Math.ceil(secondsFromMidnight - currentSeconds);
	}
	
	console.log("Interval: " + secondsFromNow + " " + (secondsFromNow + Math.floor(currentSeconds) - secondsInterval / 4));
	
	return {
		secondsFromNow: secondsFromNow,
		tolerance: (secondsFromNow + now.unix() - secondsInterval / 4)
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
	console.log("Setting for " + id);
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
			console.log("Checking expiration");
			client.ttl('taskqueue:timer:' + id, function(err, reply) {
				// TODO: Here we have a race condition--if the key was already set, but didn't have expiration set
				// (which shouldn't happen anyway), two clients could try to expire the key. This probably doesn't
				// matter: this should only happen if they check in rapid succession, in which case the key will get
				// the right expiration anyway.
				if (err) {
					console.log('Error checking ttl. Is redis down?');
					return;
				}
				
				if (reply < 0) {
					console.log('Warning: key set but not expired. Did a client crash?');
					setNextEvent(interval, id);
				}
			});
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
				var currentSeconds = moment().unix();
				if (currentSeconds > reply) {
					done();
				} else {
					// We can potentially acquire the lock if another client acquired it, and finished too
					// quickly. If that's the case, they'll have reset the tolerance to be in the future,
					// so we know what happened, and can avoid executing the callback twice.
					console.log("Lock spuriously acquired by client %s for id %s: ignoring", clientId, id);
				}
			});
		} else {
			// We tried to set it, but somebody else already holds it.
			// There are a few possiblities here:
			// 1. Another client locked it, and is currently executing. This is fine.
			// 2. Another client locked it, and crashed before unlocking.
			// 3. Another client locked it, and is taking too long to finish executing the callback.
			// We're concerned about the second two cases. So we'll expire the lock, for a long time in the future.
			// Then, if the lock expires instead of being deleted, we'll know we're in one of the second two cases,
			// and we'll set the next execution time ourselves.
			console.log("Expiring lock for " + id);
			client.expire("taskqueue:lock:" + id, lockTimeout, function(err, reply) {
				if (err) {
					console.log("Couldn't expire lock. Is redis down?");
					return;
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
			try {
				callback();
			} finally {
				markCompleted(id);
			}
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

var fido = new watchdog(600, 120); // Wake up every 12 minutes, +/- 2 minutes
console.log("Taskqueue client %s listening", clientId);
