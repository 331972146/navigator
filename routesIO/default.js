var config = require('../config'),
    ioCtrl = require('../controllers/ioCtrl'),
    postCtrl = require('../controllers/postCtrl'),
    resCtrl = require('../controllers/resCtrl');
module.exports = function (io, webEntry) {
    var ioDefault = io.of('/' + webEntry.domainName + '/' + (webEntry.routeIO || 'default')); 
    ioDefault.on('connection', function (socket) {
    	
        ioCtrl.payBill(ioDefault, socket); 
    });
};