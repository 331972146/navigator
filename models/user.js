// var mongodb = require('../helpers/mongodb');
var config = require('../config'),
    MongoClient = require('mongodb').MongoClient;
var crypto = require('crypto');
var bcrypt = require('bcrypt');
var mongoose = require('mongoose');
var timeGen = require('../helpers/timeGen');
var userSchema = new mongoose.Schema({
  username: {
    type: String
  },
  password: String,
  email: {
    type: String
  },
  mobile: {
    type: String
  },
  head: {
    Url: String, 
    path: String
  },
  personalInfo: {
    name: String, 
    gender: Number, 
    birthdate: Date, 
    idType: String, 
    idNo: String,
    idImg: [{title: {type: String}, Url: {type: String}, path: {type: String}, uploadTime: {type: Date}}], 
    intro: String, 
    abstract: String, 
    location: {
      country: {name: String, code: String},
      state: {name: String, code: String},
      city: {name: String, code: String},
      district: {name: String, code: String},
      street: String,
      zip: String,
      coordinate: {longitude: Number, latitude: Number} 
    },
    seniorUnitId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    seniorUnitName: String, 
    seniorUnitNo: Number, 
    seniorUnitCode: String, 
    legalPerson: String, 
    contactor: {name: String, phone: String, email: String}, 
    unit: String, 
    unitCode: String, 
    unitNo: Number, 
    unitId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}, 
    unitType: String, 
    tags: {}, 
    unitScale: Number, 
    unitScopes: String, 
    unitPhone: String,
    unitFax: String,
    unitAddr: String,
    recommended: {}, 
    sort: Number, 
    employeeId: String, 
    homePhone: String, 
    QQ: String, 
    contactAddr: String, 
    homeAddr: String, 
    payment: [{ 
      type: String, 
      channel: String, 
      accountNo: String, 
      bankName: String, 
      accountName: String 
    }]
  },
  accountInfo: {
    isActive: Boolean, 
    createTime: Date, 
    lastLogin: Date, 
    lastIP: String, 
    loginTimes: Number, 
    lastLoginFail: Date, 
    loginFailTimes: Number, 
    pwdQuestions: [], 
    userType: String, 
    userRole: String, 
    supervisorId: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }],
    upUserId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    userGrade: Number, 
    dealSeqNo: Number, 
    dealGrade: Number 
  },
  apiUser: {},     // 新墒跟其它平台对接的api用户接口
  extInfo: {
    yiyangbaoHealInce: {
      userType: String, 
      inceGenNum: String, 
      dealPassword: String, 
      accountName: String, 
      bankName: String, 
      accountNo: String, 
      dynamicCode: String, 
      inceId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      },
      servId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      },
      relatives: [{relation: String, name: String, idType: String, idNo: String, reId: String, mobile: String}], 
      contactor: {name: String, phone: String, email: String}, 
      handler: {name: String, phone: String, email: String}, 
      authorizedBy: [{ 
        _id: false,
        servId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}, 
        inceGenNum: {type: String}, 
        unitName: {type: String}, 
        unitId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}, 
        duration: {type: Date}, 
        times: {type: Number}, 
        isRevoked: {type: Boolean, default: false} 
      }],
      phone400: String,
      phone800: String
    },
    host: String,
    domain: String
  }
}, {
});
userSchema.index({ username: 1, 'extInfo.domain': 1 }, { unique: true });
userSchema.index({ 'personalInfo.idNo': 1, 'extInfo.domain': 1 }, { unique: true });
var userModel = mongoose.model('User', userSchema);
function User(user) {
  this.user = user;
};
User.prototype.save = function (callback) {
  var time = timeGen();
  var user = this.user;
      user['accountInfo.createTime'] = time.date;
      user['accountInfo.lastLogin'] = time.date;
      user['accountInfo.loginTimes'] = 0;
      user['accountInfo.lastLoginFail'] = null;
      user['accountInfo.loginFailTimes'] = 0;
      user.personalInfo && (user.personalInfo.idNo || (user.personalInfo.idNo = crypto.createHash('md5').update(user.username + user.extInfo.domain + new Date()).digest('hex'))) || (user['personalInfo.idNo'] = crypto.createHash('md5').update(user.username + user.extInfo.domain + new Date()).digest('hex'));
  var newUser = new userModel(user);
  newUser.save(function (err, newUser) {
    if (err) {
      return callback(err);
    }
      callback(null, newUser);
  });
};


User.yljInsert = function(toBeUsers, host, domain, callback, opts) {
  var options = opts || {
    ordered: false
  };
  var mappedUsers = [];

  var i, arrLen = toBeUsers.length;
  for(i = 0; i < arrLen; i++ ) {
    var user = toBeUsers[i];
    var tempPwd = user.idNo.slice(-6);
    var query = {
      username: toBeUsers[i].idNo, 
      'extInfo.domain': domain
    };

    User.getOne(query, function(err, userItem) {
      if (err) {
        return res.status(500).send(err.errmsg);
      }
      
      if ( !userItem) {
        bcrypt.hash(tempPwd, config.SALT_WORK_FACTOR, function(err, hash) {
          if (err) {
              return res.status(500).send(err);
          }

          var newUser =new User({
              username: user.idNo,
              password: hash,
              personalInfo: {
                name: user.name,
                gender: user.gender,
                birthdate: user.birthdate,
                idType: user.idType,
                idNo: user.idNo,
                idImg: []
              },
              accountInfo: {
                isActive: false,
                createTime: new Date(),
                loginTimes: 0,
                loginFailTimes: 0,
                userRole: 'user'
              },
              extInfo: {
                yiyangbaoHealInce: {
                  userType: 'user',
                  dealPassword: hash,
                  bankName: user.bankName,
                  accountNo: user.accountNo,
                  amount: user.amount,
                  relatives: []
                },
                host: host,
                domain: domain
              }
            });

          newUser.save(function(err, nuser){
            if (err) {
                return res.status(500).send(err.errmsg);
            }
          });
        });
        
        
      }
    });

    
  }

}

User.bulkInsert = function (toBeUsers, host, domain, callback, opts) {
  options = opts || {
    ordered: false
  };
  console.log(toBeUsers.length);
  var errArr = [];
  var resultsArr = [];
  var batchCount = 0;
  var malUsers = [];
  var batchInsert = function (index, batch) {
    var mappedUsers = [];
    var genHash = function (i, index, arrLen) {
      var user = toBeUsers[i];
      var tempPwd = user.idNo.slice(-6);
      bcrypt.hash(tempPwd, config.SALT_WORK_FACTOR, function (err, hash) { 
        if (err) {
            return res.status(500).send(err);
        }
        if (user.name && user.gender <= 2 && user.birthdate && user.idType && user.idNo) {
          mappedUsers.push({
            username: user.idNo,
            password: hash,
            personalInfo: {
              name: user.name,
              gender: user.gender,
              birthdate: user.birthdate,
              idType: user.idType,
              idNo: user.idNo,
              idImg: []
            },
            accountInfo: {
              isActive: false,
              createTime: new Date(),
              loginTimes: 0,
              loginFailTimes: 0,
              userRole: 'user'
            },
            extInfo: {
              yiyangbaoHealInce: {
                userType: 'user',
                dealPassword: hash,
                bankName: user.bankName,
                accountNo: user.accountNo,
                amount: user.amount,
                relatives: []
              },
              host: host,
              domain: domain
            }
          });
          if (mappedUsers.length + malUsers.length === arrLen) { 
            userModel
            .collection
            .insert(mappedUsers, options, function (err, results) {
              batchCount++;
              if (err && err.code !== 11000) {
                errArr[errArr.length] = err;
              }
              if (results) {
                resultsArr[resultsArr.length] = results;
              }
              if (Math.ceil(toBeUsers.length / batch) === batchCount) {
                return callback(errArr, resultsArr, malUsers);
              }
              setImmediate(function () { 
                batchInsert(batchCount * batch, batch);
              });
            });
          }
        }
        else {
          malUsers.push(user); 
          if (mappedUsers.length + malUsers.length === arrLen) {
            userModel
            .collection
            .insert(mappedUsers, options, function (err, results) {
              batchCount++;
              if (err && err.code !== 11000) {
                errArr[errArr.length] = err;
              }
              if (results) {
                resultsArr[resultsArr.length] = results;
              }
              if (Math.ceil(toBeUsers.length / batch) === batchCount) {
                return callback(errArr, resultsArr, malUsers);
              }
              setImmediate(function () { 
                batchInsert(batchCount * batch, batch);
              });
            });
          }
        }
      });
    };
    var i, arrLen = toBeUsers.length - index > batch ? batch + index : toBeUsers.length;
    for (i = index; i < arrLen; i++) {
      genHash(i, index, arrLen); 
    }
  };
  batchInsert(0, config.bulkInsertBatch); 
};
User.getOne = function (user, callback, opts, fields, populate) {
  var options = opts || {};
  var fields = fields || null;
  var populate = populate || ''; 
  userModel
  .findOne(user, fields, opts)
  .populate(populate)
  .exec(function (err, user) {
    if (err) {
      return callback(err);
    }
      callback(null, user);
  });
};
User.getSome = function (query, callback, opts, fields, populate) {
  var options = opts || {}; 
  var fields = fields || null;
  var populate = populate || ''; 
    userModel
    .find(query, fields, options)
    .populate(populate)
    .exec(function (err, users) {
      if (err) {
        return callback(err);
      }
      callback(null, users)
    });
};
User.count = function (query, callback) {
  userModel
  .count(query)
  .count(function (err, total) {
    if (err) {
      return callback(err);
    }
    callback(null, total);
  });
};
User.getExtremity = function (query, callback, opts, fields) {
  var options = opts || {}; 
  var fields = fields || null;
  userModel
  .find(query, fields, options)
  .exec(function (err, users) {
    if (err) {
      return callback(err);
    }
    callback(null, users[0]);
  });
};
User.update = function (query, obj, callback, opts) {
  var options = opts || {};
  userModel
  .update(query, obj, options, function (err, numberAffected, raw) {
    if (err) {
      return callback(err);
    }
    callback(null, numberAffected, raw);
  });
};
User.updateOne = function (query, obj, callback, opts, populate) {
  var options = opts || {};
  var populate = populate || ''; 

  userModel
  .findOneAndUpdate(query, obj, options)
  .populate(populate) 
  .exec(function (err, user) {

    if (err) {
      return callback(err);
    }
    callback(null, user);
  });
};
User.remove = function(query, callback) {
  var start = new Date();
  userModel
  .remove(query)
  .exec(function (err) {
    callback(err);
  });
};
User.removeOne = function(query, callback, opts) {
  var options = opts || {};
  userModel
  .findOneAndRemove(query, options, function (err, user) {
    if (err) {
      return callback(err);
    }
    callback(null, user);
  });
};
module.exports = User;