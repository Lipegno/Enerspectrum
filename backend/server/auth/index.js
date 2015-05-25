var express = require('express'),
    passport = require('passport'),
    models = require('../models'),
    LocalStrategy = require('passport-local').Strategy,
    BasicStrategy = require('passport-http').BasicStrategy;

var DeviceAuth = new BasicStrategy(
    function (username, password, done) {
        console.log(username, password);
        var splitUsername = username.split(':');
        if (splitUsername.length != 2) {
            done(null, false);
            return;
        }

        var producerId = splitUsername[0];
        var deviceId = splitUsername[1];

        models.Producer.findOne({ username: producerId }, function (err, user) {
            if (err) {
                done(err);
                return;
            }

            if (!user) {
                done(null, false);
                return;
            }

            for (var i = 0; i < user.devices.length; i++) {
                if (user.devices[i].id == deviceId) {
                    var device = user.devices[i];
                    break;
                }
            }

            if (!device) {
                done(null, false);
                return;
            }

            if (device.authtoken != crypto.createHmac('sha1', device.salt).update(password).digest('hex')) {
                done(null, false);
                return;
            }

            var deviceCookie = {
                device: device,
                producer: producer
            };

            done(null, deviceCookie);
            return;
        });
    }
);

var ProducerAuth = new BasicStrategy(
    function (username, password, done) {
        models.Producer.findOne({ username: username }, function (err, user) {
            if (err) {
                done(err);
                return;
            }

            if (!user) {
                done(null, false);
                return;
            }
            
            user.comparePassword(password, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }

                if (!result) {
                    done(null, false);
                    return;
                }

                done(null, user);
            });
        });
    }
);

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    models.Producer.findById(id, done);
});

passport.use('producer', ProducerAuth);
passport.use('device', DeviceAuth);

exports.router = require('./routes.js');