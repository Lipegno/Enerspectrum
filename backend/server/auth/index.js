var express = require('express'),
    passport = require('passport'),
    models = require('../models'),
    LocalStrategy = require('passport-local').Strategy,
    BasicStrategy = require('passport-http').BasicStrategy;

var DeviceAuth = new BasicStrategy(
    function (username, password, done) {
        var splitUsername = username.split('-');
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

            user.authDevice(deviceId, password, function(err, match) {
                if (err) {
                    return done(err);
                }

                if (match) {
                   return done(null, {
                         producer: user,
                         device: match
                        });
                }

                return done(null, false);
            });
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
