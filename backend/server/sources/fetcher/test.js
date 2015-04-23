var should = require('should'),
	sinon = require('sinon'),
	nock = require('nock'),
	taskqueue = require('../../taskqueue'),
	webpage = require('./webpage.js');

describe('webpage', function() {
	describe('#init', function() {
		before(function(done) {
			sinon.stub(taskqueue, 'schedule');
			done();
		});
		
		after(function(done) {
			sinon.restore(taskqueue, 'schedule');
			done();
		});
		
		it('should schedule a task callback for the schedule based on its parameters', function(done) {
			var wp = new webpage('test_page', {
				frequency: {
					start: 3 * 60,
					interval: 15 * 60
				},
				url: 'http://example.com',
				selector: '#idone'});
				
			taskqueue.schedule.calledOnce.should.equal(true);
			done();
		});
	});
		
	describe('#run', function() {
		var runCompleted = false;
		before(function(done) {
			nock('http://example.com').get('/')
				.reply(200, '<!DOCTYPE html><html><head></head><body><p id="idone">TEST TEXT</p></body></html');
				done();
				
				sinon.stub(taskqueue, 'schedule', function(interval, id, f) {
					setTimeout(function(){f(function(){runCompleted = true;});}, 10);
				});
		});
		
		after(function(done) {
			sinon.restore(taskqueue, 'schedule');
			done();
		});
		
		it('should request data from the given url', function(done) {
			var wp = new webpage('test_page', {
				frequency: {
					start: 3 * 60,
					interval: 15 * 60
				},
				url: 'http://example.com',
				selector: '#idone'});
			
			wp.on('dataReceived', function(data) {
				data.should.equal('TEST TEXT');
				setTimeout(function() {
					runCompleted.should.equal(true);
				}, 250);
				done();
			});
		});
	});
});