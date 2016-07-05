// var config = require('../config');
exports.payBill = function (io, socket) {
    socket.on('disconnect', function () {
        console.log('See you later!');
        io.emit('See you later!');
    });
    socket.on('pay bill', function (data, actions, options, cb) {
        
        if (cb) {
        	cb(socket.id); 
        }
    	if (actions === 'check') {
            data.mediSocketId = socket.id;
    		socket.to(data.userSocketId).emit('pay bill', data, actions); 
    	}
        if (actions === 'paid' || actions === 'payError' || actions === 'cancelPay') {
            socket.to(data.mediSocketId).emit('pay bill', data, actions); 
        }
    });
};
exports.otherEvent = function (io) {
};
exports.otherRoom = function (io) {
};