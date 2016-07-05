// in some kind of utilities module
module.exports = function (name, fn) {
  	if (fn instanceof RegExp) {
	  	return function (req, res, next, val) {
	    	var captures;
	    	if (captures = fn.exec(String(val))) {
		      	req.params[name] = captures[0];
		      	next();
	    	} 
	    	else {
	     		next('route');
	    	}
	  	}
	}
};