/*
 * Description: 短信/邮箱authentication中间件
 * Author: Alex Zhou
 * Created Date: 2015-08-29
 * Modified: 
 * Func: 短信验证, 邮箱验证
 * Params in: sms, email
 * Params out: req.sms, req.email
 * 
 */
var config = require('../config'),
    jwt = require('jsonwebtoken'), 
    crypto = require('crypto'),
    nodemailer = require('nodemailer'),
    fs = require('fs-extra'),
    bcrypt = require('bcrypt'),
    codes = require("rescode"),
    isEqual = require('../helpers/isDeepEqual'),
    path = require('path'),
    redis = require('redis'),
    redisClient = redis.createClient(6379, config.redisHOST),
    ACL = require('../helpers/ACL'),
    User = require('../models/user'),
    dateFormat = require('dateformat'),
    request = require('request'),
    randomGen = require('../helpers/randomGen');
exports.sms = function (options) {
  return function (req, res, next) {
    if (options.method === 'send') {
      if (!req.user && req.body.smsType !== '-reg' && req.body.smsType !== '-findPwd') {
        return res.status(422).send('请登录后操作!');
      }
      req.assert('mobile', '无效手机号').optional().isMobilePhone('zh-CN');
      req.assert('newMobile', '无效新手机号').optional().isMobilePhone('zh-CN');
      var mappedErrors = req.validationErrors(true);
      if (mappedErrors) {
        var errText = '';
        if (mappedErrors['mobile']) errText = mappedErrors['mobile'].msg + '!';
        if (mappedErrors['newMobile']) errText = mappedErrors['newMobile'].msg + '!';
        return res.status(422).send(errText);
      }
      var data = req.body;
      if (data.mobile && data.newMobile) {
        return res.status(422).send('号码重复提交!');
      }
      if (!data.mobile && !data.newMobile) return res.status(422).send('号码为空!');
      var host = req.get('host'),
          domain = host.replace(/^.*?\./, '');
      User.getOne({mobile: data.newMobile || data.mobile, 'extInfo.domain': domain}, function (err, user) {
        if (err) {
          return res.status(500).send('服务器错误(手机号查询)!');
        }
        if (user && data.smsType === '-initBind') {
          res.status(422).send('手机号码已存在, 请检查!');
        }
        else {
          var token = config.SMS_TOKEN,
              appId = config.SMS_AppId,
              accountSid = config.SMS_AccId,
              tplId = config.SMS_TPLId,
              mobile = data.mobile,
              newMobile = data.newMobile,
              smsType = data.smsType, 
              randNum = randomGen(6, 'num'),
              param =  randNum + ',' + config.SMS_EXPIRATION;
          redisClient.get(mobile + smsType, function (err, reply) {
            if (err) {
              return res.status(500).send('服务器错误(Redis手机查询)!');
            }
            if (reply) {
              redisClient.ttl(mobile + smsType, function (err, time) {
                return res.status(422).send('请等待' + time + '秒!');
              });
            }
            else {
              redisClient.set(mobile + smsType, randNum, function (err, reply) {
                redisClient.expire(mobile + smsType, config.SMS_EXPIRATION * 60);
                var auth = function () {
                  var now = new Date();
                  /**
                  * To china TimeZone
                  */
                  if (now.getTimezoneOffset()) {
                    now = now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + (8 * 60 * 60 * 1000);
                  }
                  var timestamp = dateFormat(now, 'yyyymmddHHMMss');
                  var md5 = crypto.createHash('md5');
                  md5.update(accountSid + token + timestamp);
                  var authorization = new Buffer(accountSid + ':' + timestamp).toString('base64');
                  return {
                    sig: md5.digest('hex').toUpperCase(),
                    authorization: authorization
                  }
                };
                request.post({
                  url: 'https://api.ucpaas.com/2014-06-30/Accounts/' + accountSid + '/Messages/templateSMS?sig=' + auth().sig,
                  json: true,
                  headers: {
                    'content-type' : 'application/json;charset=utf-8',
                    'Authorization': auth().authorization   
                  },
                  body: { 
                    templateSMS: {
                      "appId"      : appId,
                      "param"      : param,
                      "templateId" : tplId,
                      "to"         : mobile || newMobile
                    }
                  }
                }, function(err, res1, body) {
                  body.timer = config.SMS_EXPIRATION * 60;
                  res.json({results: body});
                });
              });
            }
          });
        }
      });
    }
    if (options.method === 'verify') {
      if (req.headers.smstype && req.headers.smsmobile && req.headers.smsauth) {
        var smsType = req.headers.smstype,
            smsMobile = req.headers.smsmobile,
            smsAuth = req.headers.smsauth;
        redisClient.get(smsMobile + smsType, function (err, reply) {
          if (err) {
            return res.status(500).send('服务器错误(Redis手机验证码查询)!');
          }
          if (reply === smsAuth) {
            req.smsAuth = {};
            req.smsAuth[smsMobile] = config.SMS_Secret; 
            next();
          }
          else {
            res.status(401).send('短信验证码错误!');
          }
        });
      }
      else {
        next();
      }
    }
  };
}