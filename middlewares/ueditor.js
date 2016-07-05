var Busboy = require('busboy');
var fs = require('fs-extra');
var os = require('os');
var path = require('path');
var snowflake = require('node-snowflake').Snowflake;
var crypto = require('crypto');
var ueditor = function (static_url, relative_url, handler) {
  return function(req, res, next) {
    var _respond = respond(static_url, relative_url, handler);
    _respond(req, res, next);
  };
};
var respond = function (static_url, relative_url, callback) {
  return function (req, res, next) {
    if (req.query.action === 'config') {
      callback(req, res, next);
      return;
    } 
    else if (req.query.action.search(/upload/) > -1) {
      var busboy = new Busboy({
        headers: req.headers
      });
      var fileInfo = {};
      busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        res.ue_up = function (res_url, cb) {
          fileInfo.tmpdir = path.join(os.tmpDir(), path.basename(filename));
          fileInfo.named = path.basename(fileInfo.tmpdir, path.extname(fileInfo.tmpdir)) + '_' + snowflake.nextId() + path.extname(fileInfo.tmpdir);
          fileInfo.dest = path.join(static_url, relative_url, res_url, fileInfo.named);
          fileInfo.res_url = relative_url + res_url;
          file.on('end', function() {
            fs.move(fileInfo.tmpdir, fileInfo.dest, function (err) { 
              if (err) {
                throw err;
                res.json({
                  'state': err.message
                });
              }
              var rs = fs.createReadStream(fileInfo.dest);
              var md5 = crypto.createHash('md5');
              md5.setEncoding('hex');
              rs.on('end', function() {
                md5.end();
                var chkMD5 = md5.read();
                if (fileInfo.md5 === chkMD5) {
                  cb(fileInfo.res_url + fileInfo.named, fileInfo.dest, fileInfo.named, path.basename(fileInfo.tmpdir, path.extname(fileInfo.tmpdir)), filename);
                }
                else {
                  fs.unlink(fileInfo.dest);
                  res.json({
                    'state': 'md5_failed'
                  });
                }
              });
              rs.pipe(md5);
            });
          });
          file.pipe(fs.createWriteStream(fileInfo.tmpdir));
        };
        res.ue_down = function () {
          file.resume(); 
        };
        callback(req, res, next, fileInfo);
      });
      busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
        fileInfo[fieldname] = val; 
      });
      return req.pipe(busboy);
    } 
    else {
      callback(req, res, next);
    }
    return;
  };
};
module.exports = ueditor;