var should = require('should'),
	converter = require('./index.js'),
	moment = require('moment'),
	_ = require('underscore');

describe('integer', function() {
	describe('#getProbability', function() {
		it('should have probabilities corresponding with how "integer" a string appears', function(done) {
			var p = converter.integer.getProbability('1');
			p.should.be.above(0.8);
			
			p = converter.integer.getProbability('asdssd');
			p.should.equal(0.0);
			
			p = converter.integer.getProbability('1.0');
			p.should.be.below(1.0);
			p.should.be.above(0.0);
			
			p = converter.integer.getProbability('1.2');
			p.should.equal(0.0);
			
			p = converter.integer.getProbability('1.000');
			p.should.be.above(0.6);
			
			p = converter.integer.getProbability('1,000');
			p.should.be.above(0.6);
			
			p = converter.integer.getProbability('1,000,000');
			p.should.be.above(0.8);
			
			p = converter.integer.getProbability('10.000.000');
			p.should.be.above(0.8);
			
			p = converter.integer.getProbability('10.000,2322');
			p.should.be.below(0.5);
			
			p = converter.integer.getProbability('10,000.00');
			p.should.be.below(0.9);
			p.should.be.above(0.0);
			
			done();
		});
	});
	
	describe("#integer", function() {
		it("should parse integers matching a given format params", function(done) {
			var ic = converter.integer();
			var result = ic("1");
			result.should.equal(1);
			
			result = ic("2.0");
			result.should.equal(2);
			
			result = ic("-1");
			result.should.equal(-1);
			
			result = ic("1.23");
			result.should.be.NaN;
			
			ic = converter.integer({thousandsSeparator: ','});
			result = ic("1");
			result.should.equal(1);
			
			result = ic("2.0");
			result.should.equal(2);
			
			result = ic("-1");
			result.should.equal(-1);
			
			result = ic("1.23");
			result.should.be.NaN;
			
			result = ic("1,000");
			result.should.equal(1000);
			
			ic = converter.integer({thousandsSeparator: '.'});
			result = ic("1");
			result.should.equal(1);
			
			result = ic("-1");
			result.should.equal(-1);
			
			result = ic("1.234");
			result.should.equal(1234);
			
			result = ic("1,000");
			result.should.be.NaN;
			
			done();
		});
	});
});

describe('floatingPoint', function() {
	describe('#getProbability', function() {
		it('should have probabilities corresponding to how "float" a string looks', function(done) {
			var p = converter.floatingPoint.getProbability('1.0');
			p.should.be.above(0.8);
			
			p = converter.floatingPoint.getProbability('1,0');
			p.should.be.above(0.8);
			
			p = converter.floatingPoint.getProbability('asdf');
			p.should.equal(0.0);
			
			p = converter.floatingPoint.getProbability('1');
			p.should.be.below(1.0);
			p.should.be.above(0.0);
			
			p = converter.floatingPoint.getProbability('1,000');
			p.should.be.above(0.8);
			
			p = converter.floatingPoint.getProbability('1.000');
			p.should.be.above(0.8);
			
			p = converter.floatingPoint.getProbability('1.000,23');
			p.should.equal(1.0);
			
			p = converter.floatingPoint.getProbability('1,000.11');
			p.should.equal(1.0);
			done();
		});
	});
	
	describe("#float", function() {
		it('should parse floats according to the format specifier', function(done) {
			var fc = converter.floatingPoint();
			var result = fc('1');
			result.should.equal(1);
			
			result = fc('1.0');
			result.should.equal(1.0);
			
			result = fc('1.2');
			result.should.equal(1.2);
			
			result = fc('-1');
			result.should.equal(-1);
			
			result = fc('a');
			result.should.be.NaN;
			
			fc = converter.floatingPoint({thousandsSeparator: ','});
			result = fc('1');
			result.should.equal(1);
			
			result = fc('1.0');
			result.should.equal(1.0);
			
			result = fc('1.2');
			result.should.equal(1.2);
			
			result = fc('-1');
			result.should.equal(-1);
			
			result = fc('1,000.2');
			result.should.equal(1000.2);
			
			result = fc('1,554');
			result.should.equal(1554);
			
			result = fc('a');
			result.should.be.NaN;
			
			fc = converter.floatingPoint({thousandsSeparator: '.'});
			result = fc('1');
			result.should.equal(1);
			
			result = fc('1,0');
			result.should.equal(1.0);
			
			result = fc('1,2');
			result.should.equal(1.2);
			
			result = fc('-1');
			result.should.equal(-1);
			
			result = fc('1.000,2');
			result.should.equal(1000.2);
			
			result = fc('1.554');
			result.should.equal(1554);
			
			result = fc('a');
			result.should.be.NaN;
			
			fc = converter.floatingPoint({decimalSeparator: ','});
			result = fc('1');
			result.should.equal(1);
			
			result = fc('1,0');
			result.should.equal(1.0);
			
			result = fc('1,2');
			result.should.equal(1.2);
			
			result = fc('-1');
			result.should.equal(-1);
			
			result = fc('1.000,2');
			result.should.be.NaN;
			
			result = fc('1000,2');
			result.should.equal(1000.2);
			
			result = fc('1.554');
			result.should.be.NaN;
			
			result = fc('a');
			result.should.be.NaN;
			
			fc = converter.floatingPoint({decimalSeparator: '.'});
			result = fc('1');
			result.should.equal(1);
			
			result = fc('1.0');
			result.should.equal(1.0);
			
			result = fc('1.2');
			result.should.equal(1.2);
			
			result = fc('-1');
			result.should.equal(-1);
			
			result = fc('1,000.2');
			result.should.be.NaN;
			
			result = fc('1,554');
			result.should.be.NaN;
			
			result = fc('a');
			result.should.be.NaN;
			
			fc = converter.floatingPoint({decimalSeparator: '.', thousandsSeparator: ','});
			result = fc('1');
			result.should.equal(1);
			
			result = fc('1.0');
			result.should.equal(1.0);
			
			result = fc('1.2');
			result.should.equal(1.2);
			
			result = fc('-1');
			result.should.equal(-1);
			
			result = fc('1,000.2');
			result.should.equal(1000.2);
			
			result = fc('1,554');
			result.should.equal(1554);
			
			result = fc('a');
			result.should.be.NaN;
			done();
		});
	});
});

function combineDateTime(dates, times, separators) {
	var formats = [];
	for (var i = 0; i < dates.length; i++) {
		formats.push(dates[i]);
		for (var j = 0; j < times.length; j++) {
			for (var k = 0; k < separators.length; k++) {
				formats.push(dates[i] + separators[k] + times[j]);
			}
		}
	}
	
	return formats;
}

var dateFormats = [
	"YYYY-MM-DD",
	"YYYY/MM/DD",
	"DD-MM-YYYY",
	"DD/MM/YYYY",
	"MM-DD-YYYY",
	"MM/DD/YYYY",
	"YY-MM-DD",
	"YY/MM/DD",
	"DD-MM-YY",
	"DD/MM/YY",
	"MM-DD-YY",
	"MM/DD/YY"
];

var timeFormats = [
	"HH:mm:ss",
	"hh:mm:ss",
	"HH:mm",
	"hh:mm"
];

var recognizedFormats = combineDateTime(dateFormats, timeFormats, [" ", "T"]);

describe('datetime', function() {
	describe('#getProbability', function() {
		it('should parse all expected formats', function(done) {
			// This may not be a good idea. It could lead to non-reproducible results in the test framework.
			var now = moment();
			for (var i = 0; i < recognizedFormats.length; i++) {
				var s = now.format(recognizedFormats[i]);
				var p = converter.datetime.getProbability(s);
				p.should.equal(1.0);
			}
			
			var p = converter.datetime.getProbability('not a date');
			p.should.equal(0.0);
			done();
		});
	});
	
	describe('#datetime', function() {
		it('should parse datetimes according to the format', function(done) {
			// This may not be a good idea. It could lead to non-reproducible results in the test framework.
			var now = moment();
			for (var i = 0; i < recognizedFormats.length; i++) {
				var dtc = converter.datetime({format: recognizedFormats[i]});
				var date = dtc(now.format(recognizedFormats[i]));
				date.should.be.type('object');
				date = dtc('not a date');
				date.should.equal(0);
			}
			
			var dtc = converter.datetime();
			var date = dtc(now.format("YYYY-MM-DD HH:mm:ss"));
			date.should.not.equal(0);
			done();
		});
	});
});

describe('string', function() {
	describe('#getProbability', function() {
		it('should accept all values as strings', function(done) {
			var p = converter.string.getProbability('');
			p.should.equal(1.0);
			
			p = converter.string.getProbability('asdf');
			p.should.equal(1.0);
			
			p = converter.string.getProbability('1.0');
			p.should.equal(1.0);
			
			p = converter.string.getProbability('5');
			p.should.equal(1.0);
			
			p = converter.string.getProbability('2/3/1255');
			p.should.equal(1.0);
			done();
		});
	});
	
	describe('#string', function() {
		it('should accept anything and convert it to a string', function(done) {
			var sc = converter.string();
			var s = sc('1');
			s.should.be.type('string');
			
			s = sc(1);
			s.should.be.type('string');
			
			done();
		});
	});
});

describe('converter', function() {
	describe('#getType', function() {
		it('should parse integers', function(done) {
			var type = converter.getType('22');
			type.name.should.equal(converter.integer.name);
			
			type = converter.getType('22,010,223');
			type.name.should.equal(converter.integer.name);
			
			type = converter.getType('25.122.322');
			type.name.should.equal(converter.integer.name);
			
			type = converter.getType('-1');
			type.name.should.equal(converter.integer.name);
			done();
		});
		
		it('should parse floats', function(done) {
			var type = converter.getType('12.0');
			type.name.should.equal(converter.floatingPoint.name);
			
			type = converter.getType('12.3');
			type.name.should.equal(converter.floatingPoint.name);
			
			type = converter.getType('-1,2');
			type.name.should.equal(converter.floatingPoint.name);
			
			type = converter.getType('3.222,3');
			type.name.should.equal(converter.floatingPoint.name);
			
			type = converter.getType('1,666.03');
			type.name.should.equal(converter.floatingPoint.name);	
			done();
		});
		
		it('should parse dates and times', function(done) {
			var type = converter.getType('1986-02-08');
			type.name.should.equal(converter.datetime.name);
			
			type = converter.getType('08/02/1986');
			type.name.should.equal(converter.datetime.name);
			
			type = converter.getType('08/02/1986 11:59');
			type.name.should.equal(converter.datetime.name);
			
			type = converter.getType('23:53:33');
			type.name.should.equal(converter.datetime.name);
			done();
		});
		
		it('should parse strings', function(done) {
			var type = converter.getType('me gustas cuando callas');
			type.name.should.equal(converter.string.name);
			
			type = converter.getType('português');
			type.name.should.equal(converter.string.name);
			
			type = converter.getType('1!');
			type.name.should.equal(converter.string.name);
			done();
		});
		
		it('should handle real-world data', function(done) {
			var data = ['07-04-2015 14:15:00', '105,861', '72,271', '17,93', '8,181', '3,33', '2,888'];
			var types = _.map(data, converter.getType);
			types[0].name.should.equal(converter.datetime.name);
			types[1].name.should.equal(converter.floatingPoint.name);
			types[2].name.should.equal(converter.floatingPoint.name);
			types[3].name.should.equal(converter.floatingPoint.name);
			types[4].name.should.equal(converter.floatingPoint.name);
			types[5].name.should.equal(converter.floatingPoint.name);
			types[6].name.should.equal(converter.floatingPoint.name);
			done();
		});
	});
});