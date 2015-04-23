function string(params) {
	return function(data) {
		if (data.toString) {
			return data.toString();
		}
	
		return "" + data;
	}
}

string.getProbability = function(data) {
	// Any data can be a string. That's why we use a lower weight to sort ourselves after other items.
	return 1.0;
};

string.weight = 0.5;
string.name = "string";

module.exports = string;