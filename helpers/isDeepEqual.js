var deepEqual = require('deep-equal');
exports.array = function (arr1, arr2, cb) {
	if (!arr1 || !arr2) return cb(false);
	if (arr1.length !== arr2.length) return cb(false);
	var i, len = arr1.length;
	for (i = 0; i < len; i++) {
		var j, equal = false;
		for (j = 0; j < len; j++) {
			if (deepEqual(arr1[i], arr2[j])) {
				equal = true;
				break;
			}
		}
		if (!equal) return cb(false);
	}
	cb(true);	
};
exports.object = function (arr1, arr2, cb) {
};