var types = {
	num: ['0','1','2','3','4','5','6','7','8','9'],
	alphaNum: ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
	hex: ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f']
};
var generator = function (len, type) {
	var strNum = len || 6,
		strArr = types[type] || types.alphaNum,
		rNum = strArr.length,
		text = '';
	for (var i = 0; i < strNum; i++) {
		var pos = Math.floor(Math.random() * rNum);
		text += strArr[pos]
	}
	return text;
}
module.exports = generator;