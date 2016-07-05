var config = require('../config'),
    ACL = require('../helpers/ACL'),
    redis = require('redis'),
    redisClient = redis.createClient(6379, config.redisHOST),
    crypto = require('crypto'),
    jwt = require('jsonwebtoken');
redisClient.on('error', function (err) {
    console.log('Error ' + err);
});
redisClient.on('connect', function () {
});
exports.verifyToken = function (options) {
  return function (req, res, next) {
    var token = (req.body && req.body.token) || getToken(req.headers) || (req.query && req.query.token) || null;
    if (options) {
      if (options.credentialsRequired === false) {
        if (token) { 
          req.user = jwt.decode(token, {json: true});
        }
        return next();
      }
    }
    redisClient.get(token, function (err, reply) {
      if (err) {
        return res.status(500).send('服务器错误, 令牌查询失败!');
      }
      if (reply) {
        return res.status(401).send('令牌已注销!');
      }
      else {
        jwt.verify(token, config.cookieSecret, function(err, decoded) {
          if (err) {
            if (err.name === 'TokenExpiredError') {
              return res.status(401).send('令牌已过期!');
            }
            return res.status(401).send(err.message + " I'm here!");
          }
          req.user = decoded;
          next();
        });  
      }  
    });
  };
};


exports.verifyOpenToken = function (options) {
  var opts = options || {};
  return function (req, res, next) {
    var token = (req.body && req.body.auth) || null;
    
    if (token) {
      var token_de = new Buffer(token, 'base64').toString().split(':');
      if (token_de[1]) {
        var timestamp = Date.now();

        if (timestamp - parseInt(token_de[1]) > 30000) { //这里判断乘以1000是外接传过来是到秒
          return res.status(401).send('验证超时!');
        }
      }
      if (token_de[0] && token_de[1]) {

          var md5 = crypto.createHash('md5');

          md5.update(token_de[0] + config.OPEN_LIST_API[token_de[0]].API_TOKEN + token_de[1]);
          var sig = md5.digest('hex').toUpperCase();

          if (req.body.sig.toUpperCase() === sig) {
            req.body.apiObj = config.OPEN_LIST_API[token_de[0]];
            return next();
          }
        
        
      }
    }
    res.status(401).send('验证失败!');
  };
};


exports.expireToken = function(req) {
  var token = getToken(req.headers);
  if (token != null) {
    redisClient.set(token, { is_expired: true });
    redisClient.expire(token, config.TOKEN_EXPIRATION);
  }
  if (req.query && req.query.refreshToken != null) {
    redisClient.expire(refreshToken, 1); 
  }
};
exports.refreshToken = function (req, res, next) {
  var refreshToken = req.body.refresh_token;
  redisClient.get(refreshToken, function (err, reply) {
    if (err) {
      return res.status(500).send('服务器错误, 凭证查询失败!');
    }
    if (reply) {
      var userPayload = JSON.parse(reply);
      var token = jwt.sign(userPayload, config.cookieSecret, {expiresIn: config.TOKEN_EXPIRATION}),
          tokenExt = token;
      if (userPayload.userRole === ACL.userRoles.medi.title) {
        tokenExt = jwt.sign(userPayload, config.cookieSecretExt, {expiresIn: config.TOKEN_EXPIRATION});
      }
      redisClient.expire(refreshToken, 3); 
        var sha1 = crypto.createHash('sha1');
        refreshToken = sha1.update(token).digest('hex');
        redisClient.set(refreshToken, JSON.stringify(userPayload), function (err, reply) {
          if (err) {
            return res.status(500).send('服务器错误, 凭证存储失败!');
          }
          return res.json({token: token, tokenExt: tokenExt, refreshToken: refreshToken});
        });
    }
    else {      
      return res.status(401).send('凭证不存在!');
    }
  });
};
var getToken = function(headers) {
  if (headers && headers.authorization) { 
    var authorization = headers.authorization;
    var part = authorization.split(' ');
    if (part.length == 2) {
      var token = part[1];
      return part[1];
    }
    else {
      return null;
    }
  }
  else {
    return null;
  }
};