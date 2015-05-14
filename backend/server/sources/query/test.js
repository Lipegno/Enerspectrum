var should = require('should'),
	query = require('./index.js'),
    moment = require('moment'), 
    async = require('async'),
    _ = require('underscore');

var sampleData = {
    'a': [
        { 'timestamp': new Date(2000), 'v': 2.0, 'w': 1.0 },
        { 'timestamp': new Date(4000), 'v': 3.0, 'w': 0.0 },
        { 'timestamp': new Date(6000), 'v': 4.0, 'w': 1.0 },
        { 'timestamp': new Date(8000), 'v': 5.0, 'w': 1.0 }
    ],
    'b': [
        { 'timestamp': new Date(1000), 'v': 1.0, 'w': 1.0 },
        { 'timestamp': new Date(3000), 'v': 3.0, 'w': 0.0 },
        { 'timestamp': new Date(5000), 'v': 1.0, 'w': 0.0 },
        { 'timestamp': new Date(7000), 'v': 3.0, 'w': 1.0 }
    ]
};

describe('query', function () {
    describe('#resample', function () {
        it('should use timepoints from the specified series', function (done) {
            function runA(callback) {
                query.resample('a', sampleData, function (err, results) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    results['a'][0].timestamp.getMilliseconds().should.equal(2000);
                    results['b'][0].timestamp.getMilliseconds().should.equal(2000);
                    results['a'][3].timestamp.getMilliseconds().should.equal(8000);
                    results['b'][3].timestamp.getMilliseconds().should.equal(8000);
                    results['a'].length.should.be(4);
                    results['b'].length.should.be(4);
                });
            };
            
            function runB(callback) {
                query.resample('b', sampleData, function (err, results) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    results['a'][0].timestamp.getMilliseconds().should.equal(1000);
                    results['b'][0].timestamp.getMilliseconds().should.equal(1000);
                    results['a'][3].timestamp.getMilliseconds().should.equal(7000);
                    results['b'][3].timestamp.getMilliseconds().should.equal(7000);
                    results['a'].length.should.be(4);
                    results['b'].length.should.be(4);
                });
            };
            
            async.series([runA, runB], function (err, result) {
                should.not.exist(err);
                done();
            });
        });

        it('should use frequency-based timepoints', function (done) {
            done();
        });
    });
});
