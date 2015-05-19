var express = require('express'),
    models = require('../models'),
    _ = require('underscore'),
    passport = require('passport');

var router = express.Router();

// TODO: Right now, there's no throttling on account creation, and anyone can create an account.
router.post('/producer',
    function (req, res) {
    var producerData = req.body;
    models.Producer.findOne({ username: producerData.username }, function (err, result) {
        if (err) {
            console.log(err);
            res.status(500).send("Error");
            return;
        }

        if (result) {
            console.log("Producer name already exists");
            res.status(400).send("Error");
            return;
        }

        var newProduer = models.Producer.create({
            username: producerData.username,
            password: producerData.password,
            isAdmin: false
        }, function (err, result) {
            if (err) {
                console.log(err);
                res.status(500).send("Error");
                return;
            }

            res.send({ 'id': result.id });
        });
    });
});

router.post('/producer/device', 
    passport.authenticate('producer'),
    function (req, res) {
    req.user.createDevice(req.body.deviceName, function (err, device) {
        if (err) {
            res.status(500).send("Error creating device");
        }

        res.send(device);
    });

});

router.get('/producer/device',
    passport.authenticate('producer'),
    function (req, res) {
        res.send(_.map(req.user.devices, function (d) { return { 'name': d.name, 'deviceId': d.deviceId }; }));
});

module.exports = router;