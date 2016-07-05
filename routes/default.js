var config = require('../config'),
    path = require('path'),
    ueditor = require('../middlewares/ueditor'),
    tokenManager = require('../middlewares/tokenManager'),
    accessManager = require('../middlewares/accessManager'), 
    userCtrl = require('../controllers/userCtrl'),
    postCtrl = require('../controllers/postCtrl'),
    resCtrl = require('../controllers/resCtrl'),
    thirdPartyAuthManager = require('../middlewares/thirdPartyAuthManager'),
    paramCheck = require('../helpers/paramCheck');
module.exports = function(app, webEntry) {
    app.param('username', paramCheck('username', /^[\d|\w]+$/));
    app.param('second', paramCheck('second', /^\d{4}-\d{2}-\d{2}_\d{6}$/));
    app.param('type', paramCheck('type', /^[0-2]$/));
    app.param('action', paramCheck('action', /^\w+[\d|\w]*$/));
    app.param('userID', paramCheck('userID', /^[0-9a-fA-F]+$/));
    app.post(['/user/register', '/user/register/:userID'], userCtrl.register);
    app.post('/user/bulkInsert', tokenManager.verifyToken(), userCtrl.bulkInsert);
    app.post('/user/yljInsert', tokenManager.verifyToken(), userCtrl.yljInsert);
    app.post('/user/insertOne', tokenManager.verifyToken(), userCtrl.insertOne);
    app.post('/user/verifyPwd', tokenManager.verifyToken(), userCtrl.verifyPwd);
    app.post('/user/verifyUser', userCtrl.verifyUser);
    app.post('/user/login', userCtrl.login);
    app.post('/user/getList', tokenManager.verifyToken(), userCtrl.getList);
    app.get('/user/getInfo', tokenManager.verifyToken(), userCtrl.getInfo);
    app.get('/user/getAccInfo', tokenManager.verifyToken(), userCtrl.getAccInfo);
    app.post('/user/getOthersInfo', tokenManager.verifyToken(), userCtrl.getOthersInfo);
    app.post('/user/getOthersInfom', tokenManager.verifyToken(), accessManager.isAuthorized('user'), userCtrl.getOthersInfom);
    app.post('/user/modify', tokenManager.verifyToken(), userCtrl.modify);
    app.post('/user/update', tokenManager.verifyToken(), userCtrl.update);
    app.post('/user/updateOne', tokenManager.verifyToken(), thirdPartyAuthManager.sms({method: 'verify'}), userCtrl.updateOne);
    app.post('/user/updateOneWithSMS', thirdPartyAuthManager.sms({method: 'verify'}), userCtrl.updateOneWithSMS);
    app.post('/user/updateOnesPwd', tokenManager.verifyToken(), userCtrl.updateOnesPwd);
    app.post('/user/bindBarcode', tokenManager.verifyToken(), userCtrl.bindBarcode);
    app.post('/user/barCodePay', tokenManager.verifyToken(), userCtrl.barCodePay);
    app.post('/user/remove', tokenManager.verifyToken(), userCtrl.remove);
    app.get('/user/removeOne', tokenManager.verifyToken(), userCtrl.removeOne);
    app.get('/user/logout', tokenManager.verifyToken({credentialsRequired: false}), userCtrl.logout);
    app.post('/refreshToken', tokenManager.refreshToken);
    app.use('/user/resUpload', tokenManager.verifyToken({credentialsRequired: false}), resCtrl.userResUpload(webEntry), resCtrl.userResUploaded);

    app.post('/post/post', tokenManager.verifyToken(), postCtrl.post);
    app.use('/UEditor/upload', ueditor(path.join(__dirname, '../public'), '/upload/' + webEntry.domain, resCtrl.ueditorUpload)); 
    app.use('/multer/upload', tokenManager.verifyToken({credentialsRequired: false}), resCtrl.multerCommonUpload(webEntry), resCtrl.multerCommonUploaded); 
};