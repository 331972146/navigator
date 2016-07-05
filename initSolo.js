// 服务器settings
var webEntry = require('./settings').webEntry;
var express = require('express');
var sio = require('socket.io');  
var debug = require('debug')('navigator');
var mongoose = require('mongoose');
var helmet = require('helmet');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var oauthServer = require('oauth2-server');
var expressValidator = require('express-validator'); 
var multer  = require('multer');
var useragent = require('express-useragent');
var fs = require('fs-extra');
var qt = require('quickthumb'); 
global.dbs = {};
var
    _config = webEntry.config || 'config',
    domainName = webEntry.domainName,
    route = webEntry.route || 'default',
    view = webEntry.view || 'default';
var config = require('./' + _config),
    dbUri = webEntry.dbUri || config.dbUri;
var routes = require('./routes/' + route);
var db = mongoose.connection; 
if (typeof(db.db) === 'undefined') {
  mongoose.connect(dbUri);
}
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log(domainName + ' MongoDB: init.js');
});
var app = express();
app.set('port', process.env.PORT || 3000); 
app.set('trust proxy', 'loopback, 121.41.28.21'); 
app.use(helmet());
var accessLog = fs.createWriteStream(__dirname + '/logs/access_' + domainName + '.log', {flags: 'a'});
var errorLog = fs.createWriteStream(__dirname + '/logs/error_' + domainName + '.log', {flags: 'a'});
app.use(logger('dev'));
app.use(logger('combined', {stream: accessLog}));
app.use(bodyParser.json({ limit: config.bodyParserJSONLimit })); 
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(expressValidator());
app.use(useragent.express());
app.all('*', function (req, res, next) { 
  var domain = req.headers.origin;
  if (config.Access_Control_Allow_Origin.indexOf(domain) > -1) {
    res.setHeader('Access-Control-Allow-Origin', domain);
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT'); 
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
  }
  if ('OPTIONS' == req.method) return res.sendStatus(200);
  next();
});
app.use('/upload', qt.static(path.join(__dirname, 'public/upload'), { 
  type: 'resize', 
  quality: 0.9 
})); 
routes(app, webEntry);
app.all('/*', function(req, res, next) { 
  res.sendFile('main.html', { root: __dirname + '/public' }); 
});
app.use(function (err, req, res, next) {
  var meta = '[' + new Date() + '] ' + req.url + '\n';
  errorLog.write(meta + err.stack + '\n');
  next();
});
var server = app.listen(app.get('port'), function() { 
  debug('Express server listening on port ' + server.address().port);
});
var io = sio(server)
try {
  require(path.resolve(__dirname, webEntry.path, 'routesIO', (webEntry.routeIO || 'default')))(io, webEntry);
}
catch (e) {
	console.log(e);
}
