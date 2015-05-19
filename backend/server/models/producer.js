var mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    crypto = require('crypto'),
    Schema = mongoose.Schema;

var SALT_WORK_FACTOR = 10;

var producerSchema = Schema({
    username: { type: String, required: true, index: { unique: true } },
    password: { type: String, required: true },
    isAdmin: Boolean,
    devices: [Schema.Types.Mixed]
});

producerSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

producerSchema.methods.authDevice = function (deviceId, authToken, callback) {
    var device = null;

    for (var i = 0; i < this.devices.length; i++) {
        if (this.devices[i].deviceId == deviceId) {
            device = this.devices[i];
            break;
        }
    }

    if (!device) {
        callback(new Error("Unrecognized device"));
    }

    bcrypt.compare(authToken, device.authToken, function (err, isMatch) {
        if (err) return callback(err);
        callback(null, isMatch);
    });
};

producerSchema.methods.createDevice = function (name, callback) {
    var self = this;
    console.log("Create device %s", name);
    crypto.randomBytes(48, function (err, result) {
        if (err) {
            return callback(err);
        }
        
        var resultStr = result.toString('hex');
        var authToken = resultStr.slice(0, resultStr.length / 2);
        var deviceId = resultStr.slice(resultStr.length / 2, -1);
        
        // Doing this means that we have no way of recovering a lost auth token.
        // Instead, the user must reset.
        hashPassword(authToken, function (err, hash) {
            if (err) {
                return callback(err);
            }
            
            self.devices.push({
                'name': name,
                'deviceId': deviceId,
                'authToken': hash
            });
            
            self.save();
            
            callback(null, {
                'deviceId': self.username + ':' + deviceId,
                'name': name,
                'authToken': authToken
            });
        });
    })
};

function hashPassword(password, callback) {
    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return callback(err);
        
        // hash the password along with our new salt
        bcrypt.hash(password, salt, callback);
    });
}

producerSchema.pre('save', function (next) {
    var producer = this;
    
    // only hash the password if it has been modified (or is new)
    if (!producer.isModified('password')) return next();
    
    hashPassword(producer.password, function (err, result) {
        if (err) {
            return next(err);
        }

        producer.password = result;
        next();
    });
});

var Producer = mongoose.model('Producer', producerSchema);
module.exports = Producer;