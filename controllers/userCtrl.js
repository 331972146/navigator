var config = require('../config'),
    jwt = require('jsonwebtoken'), 
    crypto = require('crypto'),
    nodemailer = require('nodemailer'),
    fs = require('fs-extra'),
    bcrypt = require('bcrypt'),
    codes = require("rescode"),
    pinyin = require("pinyin"),
    isEqual = require('../helpers/isDeepEqual'),
    tokenManager = require('../middlewares/tokenManager'),
    path = require('path'),
    redis = require('redis'),
    redisClient = redis.createClient(6379, config.redisHOST),
    ACL = require('../helpers/ACL'),
    User = require('../models/user');
var transporter = nodemailer.createTransport({
    host: 'smtp.163.com',
    port: 25,
    auth: {
        user: 'yiqifucorp@163.com',
        pass: 'yiqifu20110830'
    }
});
exports.register = function (req, res) {
    req.assert('username', '无效用户名').notEmpty().isAlphanumeric(); 
    req.assert('password', '无效密码').notEmpty().len(1, 20);
    req.assert('email', '无效邮箱').notEmpty().isEmail();
    req.assert('mobile', '无效手机号').notEmpty().isMobilePhone('zh-CN');
    var mappedErrors = req.validationErrors(true);
    if (mappedErrors) {
        var errText = '';
        if (mappedErrors.username) errText += mappedErrors.username.msg + ', ';
        if (mappedErrors.password) errText += mappedErrors.password.msg + ', ';
        if (mappedErrors.email) errText += mappedErrors.email.msg + ', ';
        if (mappedErrors.mobile) errText += mappedErrors.mobile.msg + '!';
        return res.status(422).send(errText);
    }
    var username = req.body.username,
        password = req.body.password,
        password_re = req.body['password-repeat'],
        email = req.body.email,
        mobile = req.body.mobile,
        captchaTxt = req.body['captcha-txt'],
        recommUserID = req.params.userID;
    if (captchaTxt != req.session.captchaTxt.toLowerCase()) {
        req.flash('error', '校验码输入错误!');
        return res.redirect(req.originalUrl);
    }
    if (password_re != password) {
        req.flash('error', '两次输入的密码不一致!');
        return res.redirect(req.originalUrl);
    }
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    var query = {
        $or: [
            {email: email || '@@@@@@', 'extInfo.domain': domain},
            {mobile: mobile || '@@@@@@', 'extInfo.domain': domain},
            {username: username || '@@@@@@', 'extInfo.domain': domain}
        ]
    };
    User.getOne(query, function (err, user) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect(req.originalUrl);
        }
        if (user) {
            var err_msg = '';
            if (user.username === username) {
                err_msg = '用户已存在! ';
            }
            if (user.email === email) {
                err_msg += '邮箱已存在! ';
            }
            if (user.mobile === mobile) {
                err_msg += '手机已存在!';
            }
            req.flash('error', err_msg);
            return res.redirect(req.originalUrl);
        }
        if (recommUserID) {
            User.getOne({_id: recommUserID}, function (err, user) {
                if (err) {
                    req.flash('error', '推荐人不存在! 请重新确认或<a href="/reg">点击此处</a>单独注册');
                    return res.redirect(req.originalUrl);
                }
                if (user) {
                    var userLevel = user.accountInfo.userLevel;
                    var offset = config.userLeveloffset;
                    if (userLevel >= config.userLeveldown) {
                        var range = Math.pow(10, userLevel - offset),
                            rangeBottom = user.accountInfo.userSeqNo - (user.accountInfo.userSeqNo % range),
                            rangeTop = rangeBottom + range;
                        User.getExtremity({'accountInfo.userSeqNo': {$gte: rangeBottom, $lt: rangeTop}}, {'accountInfo.userSeqNo': -1}, function (err, maxUser) {
                            var newSeqNo, newLevel;
                            if (userLevel - config.userLevelinterval > 0) {
                                newSeqNo = maxUser.accountInfo.userSeqNo - (maxUser.accountInfo.userSeqNo % Math.pow(10, userLevel - config.userLevelinterval - offset)) + Math.pow(10, userLevel - config.userLevelinterval - offset);
                                newLevel = userLevel - config.userLevelinterval;
                            }
                            else {
                                newSeqNo = maxUser.accountInfo.userSeqNo + 1;
                                newLevel = 0;
                            }
                            if (newSeqNo >= rangeTop) {
                                req.flash('error', '当前推荐人推荐额度已满');
                                return res.redirect(req.originalUrl);
                            }
                            bcrypt.genSalt(config.SALT_WORK_FACTOR, function (err, salt) {
                                if (err) {
                                    req.flash('error', err.message);
                                    return res.redirect(req.originalUrl);
                                }
                                bcrypt.hash(password.toString(), salt, function (err, hash) {
                                    if (err) {
                                        req.flash('error', err.message);
                                        return res.redirect(req.originalUrl);
                                    }
                                    var newUser = new User({
                                        username: username,
                                        password: hash,
                                        email: email,
                                        mobile: mobile,
                                        accountInfo: {
                                            isActive: false,
                                            dealSeqNo: user.accountInfo.dealSeqNo,
                                            userRole: 'user',
                                            userLevel: newLevel,
                                            userSeqNo: newSeqNo
                                        },
                                        extInfo: {
                                            host: host,
                                            domain: domain
                                        }
                                    });
                                    newUser.save(function (err, user) {
                                        if (err) {
                                            req.flash('error', err.message);
                                            return res.redirect(req.originalUrl);
                                        }
                                        var verifyUrl = req.protocol + '://' + req.get('host') + '/interface/userAccountVerify/' + user._id;
                                        var mailOptions = {
                                            from: 'Yiqifu<yiqifucorp@163.com>',
                                            to: email,
                                            subject: '账户验证邮件',
                                            html: '<a href="' + verifyUrl + '">点击此处</a>, 或者复制并在浏览器中打开下面的链接:<p>' + verifyUrl +  '</p>'
                                        };
                                        transporter.sendMail(mailOptions, function (error, info){
                                            if (error) {
                                                console.log(error);
                                                req.session.user = user;
                                                req.flash('error', error.response);
                                                res.redirect('/');
                                            }
                                            else{
                                                console.log('Message sent: ' + info.response);
                                                req.session.user = user;
                                                req.flash('success', '注册成功, 请登录邮箱验证激活!');
                                                res.redirect('/');
                                            }
                                        });
                                    });
                                });
                            });
                        });
                    }
                    else {
                        req.flash('error', '无推荐权限, 请单独注册!');
                        return res.redirect('/reg');
                    }
                }
                else {
                    req.flash('error', '推荐人不存在! 请重新确认或<a href="/reg">点击此处</a>单独注册');
                    return res.redirect(req.originalUrl);
                }
            });
        }
        else {
            bcrypt.genSalt(config.SALT_WORK_FACTOR, function (err, salt) {
                if (err) {
                    req.flash('error', err.message);
                    return res.redirect(req.originalUrl);
                }
                bcrypt.hash(password.toString(), salt, function (err, hash) {
                    if (err) {
                        req.flash('error', err.message);
                        return res.redirect(req.originalUrl);
                    }
                    var newUser = new User({
                        username: username,
                        password: hash,
                        email: email,
                        mobile: mobile,
                        accountInfo: {
                            isActive: false,
                            dealSeqNo: 0,
                            userRole: 'user',
                            userLevel: 0,
                            userSeqNo: 0
                        },
                        extInfo: {
                            host: host,
                            domain: domain
                        }
                    });
                    newUser.save(function (err, user) {
                        if (err) {
                            req.flash('error', err.message);
                            return res.redirect(req.originalUrl);
                        }
                        var verifyUrl = req.protocol + '://' + req.get('host') + '/interface/userAccountVerify/' + user._id;
                        var mailOptions = {
                            from: 'Yiqifu<yiqifucorp@163.com>',
                            to: email,
                            subject: '账户验证邮件',
                            html: '<a href="' + verifyUrl + '">点击此处</a>, 或者复制并在浏览器中打开下面的链接:<p>' + verifyUrl +  '</p>'
                        };
                        transporter.sendMail(mailOptions, function (error, info){
                            if (error) {
                                console.log(error);
                                req.session.user = user;
                                req.flash('error', error.response);
                                res.redirect('/');
                            }
                            else{
                                console.log('Message sent: ' + info.response);
                                req.session.user = user;
                                req.flash('success', '注册成功, 请登录邮箱验证激活!');
                                res.redirect('/');
                            }
                        });
                    });
                });
            });
        }
    });
};
exports.bulkInsert = function (req, res) {
    req.assert(['incePolicy', 'unit', '_id'], '无效单位').notEmpty().len(24, 24).isAlphanumeric(); 
    req.assert('incePolicy.branch', '无效机构名').optional().matches(/^[\u4e00-\u9fa5]{2,50}$/);
    var mappedErrors = req.validationErrors(true);
    if (mappedErrors) {
        console.log(mappedErrors);
        var errText = '';
        if (mappedErrors['incePolicy.unit._id']) errText = mappedErrors['incePolicy.unit._id'].msg + '!';
        if (mappedErrors['incePolicy.branch']) errText = mappedErrors['incePolicy.branch'].msg + '!';
        return res.status(422).send(errText);
    }
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    var toBeUsers = req.body.users;
                    User.bulkInsert(toBeUsers, host, domain, function (err, results, malUsers) {
                        if (err.length > 0) {
                            req.bulkInsertRes = {
                                malUsers: malUsers,
                                userResults: results,
                                userError: err
                            };
                                return res.status(500).send(req.bulkInsertRes);
                        }
                        req.bulkInsertRes = {
                            malUsers: malUsers,
                            userResults: results
                        };
                        inceCtrl.bulkInsert(req, res);
                    });
};

exports.yljInsert = function(req, res) {
    req.assert(['incePolicy', 'unitYlj', '_id'], '无效单位').notEmpty().len(24, 24).isAlphanumeric(); 
    req.assert('incePolicy.branchYlj', '无效机构名').optional().matches(/^[\u4e00-\u9fa5]{2,50}$/);
    var mappedErrors = req.validationErrors(true);
    if (mappedErrors) {
        console.log(mappedErrors);
        var errText = '';
        if (mappedErrors['incePolicy.unitYlj._id']) errText = mappedErrors['incePolicy.unitYlj._id'].msg + '!';
        if (mappedErrors['incePolicy.branchYlj']) errText = mappedErrors['incePolicy.branchYlj'].msg + '!';
        return res.status(422).send(errText);
    }

    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');

    var toBeUsers = req.body.users;

    
    var genHash = function(index) {
        var user = toBeUsers[index];        
        var tempPwd = user.idNo.slice(-6);
        var query = {
          username: user.idNo, 
          'extInfo.domain': domain
        };
       
        User.getOne(query, function(err, userItem) {
          if (err) {
            return res.status(500).send(err.errmsg);
          }

            if (!userItem) {
                bcrypt.hash(tempPwd, config.SALT_WORK_FACTOR, function(err, hash) {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    var tempUser = {
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
                    };
                    var newUser = new User(tempUser);
                    newUser.save(function(err, nuser) {
                        if (err) 
                            console.log(err);
                            // return res.status(500).send(err.errmsg);
                    })                    
                });      
            } 
        });
    };

    var insertUnitInsurances = function() {
        var inceInfo = req.body.incePolicy;
        var servUser = req.user;
        
        var inceInsert = function(unitId, servId, inceId) { 
            var inceObjects = {}; 

            for(var i = 0; i < toBeUsers.length; i++) {
                var uniqueOne = toBeUsers[i].idNo + '-' + inceInfo.inceYljNo;
                var d = new Date(toBeUsers[i].inceCreateTime);
                var monthInt = parseInt(d.getMonth()) + 1;
                var startMonth = d.getFullYear() + '-' + (monthInt > 9 ? monthInt : '0' + monthInt) ;//把月份一位改成两位的
                var unitAmount = parseFloat(toBeUsers[i].unitAmount || 0);  //公司部份的金额 如果没有为0
                var amount = parseFloat(toBeUsers[i].amount || 0) + unitAmount;
                amount = (toBeUsers[i].detailType === 3) ? (0-amount) : amount; // 判断是否为支出部份
                var tempInceItems = {
                    month: startMonth, 
                    startTime: toBeUsers[i].inceCreateTime,
                    createTime: toBeUsers[i].inceCreateTime,
                    unitPrice: unitAmount,
                    price: parseFloat(toBeUsers[i].amount || 0),
                    originalUnitPrice:unitAmount,                           // 记录投保的单位原始金额
                    originalPrice: parseFloat(toBeUsers[i].amount || 0),    // 记录投保的个人原始金额
                    cycleDay: parseInt(toBeUsers[i].cycleDay) || config.YLJ_CYCLE_DAY,
                    yearInterest: parseInt(toBeUsers[i].yearInterest) || config.YLJ_YEAR_INTEREST,
                    detailTitle: toBeUsers[i].detailTitle,
                    detailType: inceInfo.inceYljNo + '-' + toBeUsers[i].idNo + '-' + toBeUsers[i].detailType
                };
                

                if (inceObjects[uniqueOne]) {
                    // console.log(i + ': hahahahahahahaha');
                    // setTimeout(function () {
                        inceObjects[uniqueOne].inceItems.push(tempInceItems);
                        inceObjects[uniqueOne].amount += amount;
                        //inceObjects[uniqueOne].amountDetails = amountDetails;
                        if (toBeUsers[i].inceType === 5) {
                            inceObjects[uniqueOne].amountDetails[0]['amount'] += amount;
                            inceObjects[uniqueOne].amountDetails[0]['available'] += amount;
                        }
                    // }, 0);
                }
                else {

                    var isSettlement, amountDetails = [];

                    if (toBeUsers[i].inceType === 4) {
                        isSettlement = false;
                        
                    } else if (toBeUsers[i].inceType === 5) {
                        if (toBeUsers[i].amountPhoto == undefined) {
                            toBeUsers[i].amountPhoto = '病历页-emrec|发票-recpt';
                        }

                        isSettlement = true;
                        var amountPhotos = toBeUsers[i].amountPhoto.split('|');
                        var photoArr = [], azyArr;
                        for(var t=0; t < amountPhotos.length; t++) {
                            azyArr = amountPhotos[t].split('-');
                            photoArr.push({title: azyArr[0], fieldName: azyArr[1]});
                        }

                        amountDetails.push({
                            amount: amount, 
                            consumed:0, 
                            freeze: 0, 
                            available:amount,
                            amountType: inceInfo.inceYljNo + '-' + toBeUsers[i].idNo + '-1', 
                            amountText: toBeUsers[i].amountText || '医疗补充金额',
                            amountSet: {photo: photoArr}
                        });

                    }
                    
                    inceObjects[uniqueOne] = {
                        name: toBeUsers[i].name,
                        gender: toBeUsers[i].gender,
                        birthdate: toBeUsers[i].birthdate,
                        idType: toBeUsers[i].idType,
                        idNo: toBeUsers[i].idNo,
                        unit: inceInfo.unitYlj.name + (inceInfo.branchYlj || ''),
                        inceGenNum: inceInfo.inceYljNo,
                        inceType: toBeUsers[i].inceType,
                        bankName: toBeUsers[i].bankName,
                        accountNo: toBeUsers[i].accountNo,
                        amount: amount,
                        amountDetails: amountDetails,
                        isActivated: false,
                        isAuditing: true,
                        isSettlement: isSettlement,
                        unitId: unitId,
                        inceId: inceId,
                        servId: servId,
                        inceItems: [tempInceItems],
                        version: {
                            createTime: new Date(),
                            revision: 0,
                            revisedBy: [{userId: servId, revisedTime: new Date()}],
                            auditedBy: [{userId: servId, auditedTime: new Date()}]
                        }
                    };
                }
            }

            var saveInce = function (inceObj) {
                Insurance.getOne({inceGenNum: inceInfo.inceYljNo, inceType: inceObj.inceType, idNo: inceObj.idNo }, function(err, ince) {
                    if (err) {
                        return res.status(500).send(err.errmsg);
                    }

                    // console.log(inceObj.idNo);

                    if (!ince) {
                        var newInsurance = new Insurance(inceObj);
                        newInsurance.save(function(err, nInsurance) {
                            if (err) {
                                console.log(err);
                                return res.status(500).send(err.message);
                            }

                        });
                    }
                    else {
                        ince.inceItems.push.apply(ince.inceItems, inceObj.inceItems);
                        var upObj = {
                            '$set': {
                                'inceItems': ince.inceItems
                            },
                            amount: ince.amount + inceObj.amount
                        }
                        if ( ince.inceType === '5' ) {
                            upObj['$set']['amountDetails.0.amount'] = ince.amountDetails[0].amount 
                                + inceObj.amountDetails[0]['amount'];
                            upObj['$set']['amountDetails.0.available'] = ince.amountDetails[0].available 
                                + inceObj.amountDetails[0]['available'];
                        }

                        Insurance.update({'_id': ince._id}, upObj, function (err, numberAffected, raw) {
                            if (err) {
                                return res.status(500).send(err.errmsg);
                            }
                            console.log(err, numberAffected, raw);
                            //res.json({results: {count: numberAffected, raw: raw}});
                        });
                    }
                });
            };

            for(var key in inceObjects) {
                // console.log(inceObjects[key]);
                saveInce(inceObjects[key]);

                // Insurance.getOne({inceGenNum: inceInfo.inceYljNo, inceType: inceObjects[key].inceType, idNo: inceObjects[key].idNo }, function(err, ince) {
                //     if (err) {
                //         return res.status(500).send(err.errmsg);
                //     }

                //     console.log(key);


                //     // if (!ince) {
                //     //     var newInsurance = new Insurance(inceObjects[key]);
                //     //     newInsurance.save(function(err, nInsurance) {
                //     //         if (err) {
                //     //             console.log(err);
                //     //             return res.status(500).send(err.message);
                //     //         }

                //     //         console.log(nInsurance);
                //     //     });
                //     // }
                //     // else {
                //     //     var upObj = {
                //     //         '$push': {
                //     //             'inceItems': inceObjects[key].inceItems
                //     //         },
                //     //         amount: ince.amount + inceObjects[key].amount
                //     //     }

                //     //     Insurance.update({'_id': ince._id}, upObj, function (err, numberAffected, raw) {
                //     //         if (err) {
                //     //             return res.status(500).send(err.errmsg);
                //     //         }
                //     //         console.log(err, numberAffected, raw);
                //     //         //res.json({results: {count: numberAffected, raw: raw}});
                //     //     });
                //     // }
                // });
            }
            // console.log(inceObjects);
            
            res.json({results: {}});
        }

        User.getOne({_id: servUser._id}, function (err, serv) {

            if (err) {
                console.log(err);
                return res.status(500).send(err.message);
            }

            var unitName = inceInfo.unitYlj.name + (inceInfo.branchYlj || ''),
                unitId = inceInfo.unitYlj._id,
                unitPinyin = pinyin(inceInfo.branchYlj || '', {
                    segment: false, 
                    heteronym: false, 
                    style: pinyin.STYLE_FIRST_LETTER
                }).join('');

            User.getOne({'personalInfo.name': unitName, _id: unitId}, function (err, unit) {
                if (err) {
                    console.log(err);
                    return res.status(500).send(err.message);
                }

                if (unit) {
                    if (unit.accountInfo.isActive !== true) {
                        User.updateOne({_id: unit._id}, {$set: {'accountInfo.isActive': true}}, function (err, unit) {
                            console.log(unit.accountInfo.isActive);
                        });
                    }
                    return inceInsert(unit._id, serv._id, serv.extInfo.yiyangbaoHealInce.inceId);
                }

                bcrypt.genSalt(config.SALT_WORK_FACTOR, function(err, salt) {

                    if (err) {
                        return res.status(500).send(err.message);
                    }
                    bcrypt.hash(config.defaultPwd, salt, function(err, hash) {
                        if (err) {
                            return res.status(500).send(err.message);
                        }

                        var newUnit = new User({
                            username: inceInfo.inceYljNo + (unitPinyin || ''),
                            password: hash,
                            email: inceInfo.email,
                            personalInfo: {
                                name: inceInfo.unitYlj.name + (inceInfo.branchYlj || ''),
                                idNo: inceInfo.idYljNo || undefined,
                                seniorUnitId: inceInfo.unitYlj._id,
                                seniorUnitName: inceInfo.branchYlj && inceInfo.unitYlj.name || undefined
                            },
                            accountInfo: {
                                isActive: true,
                                userRole: 'unit'
                            },
                            extInfo: {
                                yiyangbaoHealInce: {
                                    userType: 'unit',
                                    servId: serv._id
                                },
                                host: req.get('host'),
                                domain: domain
                            }
                        });
                        newUnit.save(function (err, unit) {
                            if (err) {
                                return res.status(500).send(err.message);
                            }
                            inceInsert(unit._id, serv._id, serv.extInfo.yiyangbaoHealInce.inceId);
                        });
                    });
                });
            });
        });
    };

    var i, arrLen = toBeUsers.length, users = {};
    for(i = 0; i < arrLen; i++) {
        if (!users[toBeUsers[i].idNo]) {
            users[toBeUsers[i].idNo] = true;
            genHash(i);
        }
    }    
    insertUnitInsurances();

}

exports.insertOne = function (req, res) {
    req.assert('username', '无效用户名').notEmpty().isAlphanumeric(); 
    req.assert('password', '无效密码').notEmpty().len(1, 20);
    req.assert('email', '无效邮箱').notEmpty().isEmail();
    req.assert('mobile', '无效手机号').notEmpty();
    req.assert('idNo', '无效证件号').notEmpty().len(6, 20).isAlphanumeric();
    var mappedErrors = req.validationErrors(true);
    if (mappedErrors) {
        var errText = '';
        if (mappedErrors.username) errText += mappedErrors.username.msg + ', ';
        if (mappedErrors.password) errText += mappedErrors.password.msg + ', ';
        if (mappedErrors.email) errText += mappedErrors.email.msg + ', ';
        if (mappedErrors.mobile) errText += mappedErrors.mobile.msg + ', ';
        if (mappedErrors.idNo) errText += mappedErrors.idNo.msg + '!';
        return res.status(422).send(errText);
    }
    var username = req.body.username,
        password = req.body.password,
        password_re = req.body.repeatPassword,
        email = req.body.email,
        mobile = req.body.mobile,
        name = req.body.name,
        gender = req.body.gender,
        idType = req.body.idType,
        idNo = req.body.idNo,
        inceId = req.user.userRole === 'ince' && req.user._id || undefined,
        servId = req.user.userRole === 'serv' && req.user._id || undefined,
        userRole = req.body.userRole.value,
        seniorUnitCode = req.body.seniorUnitCode,
        unitCode = req.body.unitCode;
    if (password_re != password) {
        return res.status(422).send('两次输入的密码不一致!');
    }
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    var query = {
        $or: [
            {email: email || '@@@@@@', 'extInfo.domain': domain},
            {mobile: mobile || '@@@@@@', 'extInfo.domain': domain},
            {username: username || '@@@@@@', 'extInfo.domain': domain}
        ]
    };
    User.getOne(query, function (err, user) {
        if (err) {
            return res.status(500).send(err.errmsg);
        }
        if (user) {
            var errMsg = '';
            if (user.username === username) {
                errMsg = '用户已存在! ';
            }
            if (user.email === email) {
                errMsg += '邮箱已存在! ';
            }
            if (user.mobile === mobile) {
                errMsg += '手机已存在!';
            }
            return res.status(422).send(errMsg);
        }
        bcrypt.genSalt(config.SALT_WORK_FACTOR, function (err, salt) {
            if (err) {
                return res.status(500).send(err);
            }
            bcrypt.hash(password.toString(), salt, function (err, hash) {
                if (err) {
                    return res.status(500).send(err);
                }
                var newUser = new User({
                    username: username,
                    password: hash,
                    email: email,
                    mobile: mobile,
                    personalInfo: {
                        name: name,
                        gender: gender,
                        idType: idType,
                        idNo: idNo,
                        seniorUnitCode: seniorUnitCode,
                        unitCode: unitCode
                    },
                    accountInfo: {
                        isActive: false,
                        createTime: new Date(),
                        lastLogin: null,
                        loginTimes: 0,
                        lastLoginFail: null,
                        loginFailTimes: 0,
                        userRole: userRole
                    },
                    extInfo: {
                        yiyangbaoHealInce: {
                            userType: userRole,
                            inceId: inceId,
                            servId: servId
                        },
                        host: host,
                        domain: domain
                    }
                });
                newUser.save(function (err, user) {
                    if (err) {
                        return res.status(500).send(err.errmsg);
                    }
                    var userObj = {
                        _id: user._id,
                        username: user.username,
                        email: user.email,
                        mobile: user.mobile,
                        personalInfo: user.personalInfo,
                        accountInfo: user.accountInfo,
                        extInfo: user.extInfo
                    };
                    res.json({results: userObj});
                });
            });
        });
    });
};
exports.verifyPwd = function (req, res) {
    req.assert('password', '无效密码').notEmpty().len(1, 20);
    var mappedErrors = req.validationErrors(true);
    if (mappedErrors) {
        var errText = '';
        if (mappedErrors.password) errText = mappedErrors.password.msg;
        return res.status(422).send(errText);
    }
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    var query = { _id: req.user._id };
    User.getOne(query, function (err, user) {
        if (err) {
            console.log(err);
            return res.status(500).send('服务器错误, 用户查询失败!');
        }
        if (!user) {
            return res.status(404).send('用户不存在!'); 
        }
        bcrypt.compare(req.body.password.toString(), user.password, function (err, isMatch) {
            if (err) {
                return res.status(500).send('服务器错误, 密码比对失败!');
            }
            if (!isMatch) {
                return res.status(401).send('密码错误!');
            }
            res.json({results: 'OK'});
        });
    });
};
exports.verifyUser = function (req, res) {
    req.assert('user', '无效输入').notEmpty().len(1, 20);
    var mappedErrors = req.validationErrors(true);
    if (mappedErrors) {
        var errText = '';
        if (mappedErrors.user) errText = mappedErrors.user.msg;
        return res.status(422).send(errText);
    }
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    var fields = '_id accountInfo.pwdQuestions accountInfo.userRole',
        query = {
            $or: [
                {'personalInfo.idNo': req.body.user, 'extInfo.domain': domain},
                {mobile: req.body.user, 'extInfo.domain': domain},
                {email: req.body.user, 'extInfo.domain': domain},
                {username: req.body.user, 'extInfo.domain': domain}
            ]
        },
        pwdQsts = req.body.pwdQst;
    if (pwdQsts) {
        if (!(pwdQsts instanceof Array) || !(pwdQsts.length === 3) || !pwdQsts[0] || !pwdQsts[1] || !pwdQsts[2] || !pwdQsts[0].a || !pwdQsts[1].a || !pwdQsts[2].a || !pwdQsts[0].q || !pwdQsts[1].q || !pwdQsts[2].q) {
            return res.status(422).send('密保问题回答不完整!');
        }
    }
    User.getOne(query, function (err, user) {
        if (err) {
            return res.status(500).send('服务器错误, 用户查询失败!');
        }
        if (!user) {
            return res.status(404).send('用户不存在!'); 
        }
        var pwdQuestions = user.accountInfo.pwdQuestions;
        if (pwdQsts) {
            return isEqual.array(pwdQsts, pwdQuestions, function (isEqual) {
                if (!isEqual) return res.status(422).send('答案不一致!');
                var userRole = user.accountInfo.userRole || ACL.userRoles.public.title;
                var userPayload = {
                    _id: user._id,
                    userRole: userRole,
                    reset: true
                };
                var resetPwdToken = jwt.sign(userPayload, config.cookieSecret, {expiresIn: config.resetPwdTOKEN_EXPIRATION});
                res.json({results: resetPwdToken}); 
            });
        }
        if (pwdQuestions && pwdQuestions.length === 3) {
            var pwdQst = [];
            for (var i = 0; i < 3; i++) {
                pwdQst[i] = {q: pwdQuestions[i].q};
            }
            return res.json({results: pwdQst});
        }
        res.status(422).send('未设置密保问题, 请拨打客服电话重置密码!');
    }, null, fields, null);
};
exports.login = function (req, res) {
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    
    var query = {
        $or: [
            {mobile: req.body.username, 'extInfo.domain': domain},
            {email: req.body.username, 'extInfo.domain': domain},
            {username: req.body.username, 'extInfo.domain': domain}
        ]
    };
    if (req.body.username === '' || req.body.password === '') {
        return res.status(422).send('请完整填写用户名或密码!'); 
    }
    User.getOne(query, function (err, user) {
        if (err) {
            console.log(err);
            return res.status(500).send('服务器错误, 用户查询失败!');
        }
        if (!user) {
            return res.status(404).send('用户不存在!'); 
        }
        var currentTime = new Date();
        var lastLoginFailTime = user.accountInfo.lastLoginFail || currentTime;
        var loginFailTimes = user.accountInfo.loginFailTimes;
        if (loginFailTimes > 5 && (currentTime.getTime() - lastLoginFailTime.getTime()) < config.delayWhenFailLogin) {
            return res.status(401).send('请5分钟后重试!');
        }
        if (loginFailTimes > 5 && (currentTime.getTime() - lastLoginFailTime.getTime()) > config.delayWhenFailLogin) {
            loginFailTimes--;
            lastLoginFailTime = currentTime;
        }
        bcrypt.compare(req.body.password.toString(), user.password, function (err, isMatch) {
            if (err) {
                return res.status(500).send('服务器错误, 密码比对失败!');
            }
            if (!isMatch) {
                return User.update(query, { 
                    'accountInfo.lastLoginFail': lastLoginFailTime,
                    'accountInfo.loginFailTimes': loginFailTimes + 1
                }, function (err) {
                    if (err) {
                        return res.status(500).send('服务器错误, 登录信息更新错误!');
                    }
                    var errMsg = '密码错误, 还有' + (5 - loginFailTimes) + '次机会!';
                    if (loginFailTimes > 4) {
                        errMsg = '密码输入错误' + (loginFailTimes + 1) + '次, 请5分钟后重试!'
                    }
                    return res.status(401).send(errMsg); 
                });
            }
            var upObj = {
                'accountInfo.lastLogin': new Date(),
                'accountInfo.loginTimes': user.accountInfo.loginTimes + 1,
                'accountInfo.loginFailTimes': 0
            };
            var justActivated = false;
            if (user.accountInfo.isActive === false) { 
                justActivated = true; 
                upObj['accountInfo.isActive'] = true; 
            }
            if (user.extInfo.yiyangbaoHealInce.userType === 'user') { 
                if (!user.extInfo.yiyangbaoHealInce.dealPassword) { 
                    justActivated = true;
                }
                Insurance.update({idNo: user.personalInfo.idNo, isActivated: false}, {userId: user._id, isActivated: true}, function (err, numberAffected, raw) {
                }, {multi: true});
            }
            User.update(query, upObj, function (err) {
                if (err) {
                    return res.status(500).send('服务器错误, 激活信息更新错误!');
                }
                var userRole = user.accountInfo.userRole || ACL.userRoles.public.title;
                var userPayload = {
                    _id: user._id,
                    userRole: userRole
                };
                var token = jwt.sign(userPayload, config.cookieSecret, {expiresIn: config.TOKEN_EXPIRATION}),
                    tokenExt = token;
                if (userRole === ACL.userRoles.medi.title) {
                    userPayload.seniorUnitCode = user.personalInfo.seniorUnitCode;
                    userPayload.unitCode = user.personalInfo.unitCode;
                    tokenExt = jwt.sign(userPayload, config.cookieSecretExt, {expiresIn: config.TOKEN_EXPIRATION});
                }
                var sha1 = crypto.createHash('sha1'),
                    refreshToken = sha1.update(token).digest('hex');
                redisClient.set(refreshToken, JSON.stringify(userPayload), function (err, reply) {
                    if (err) {
                        return res.status(500).send('服务器错误, 凭证存储失败!');
                    }
                    var results = {token: token, tokenExt: tokenExt, refreshToken: refreshToken};
                    if (justActivated) {
                        results.justActivated = true;
                    }
                    res.json({results: results});
                });
            });
        });
    });
};
exports.getList = function (req, res) {
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    var query = req.body.query || {},
        projection;
    if (typeof(query) === 'object' && typeof(query.length) === 'number') {
        var i, len = query.length;
        for (i = 0; i < len; i++) {
            query[i]['extInfo.domain'] = domain;
        }
        query = {$or: query};
    }
    if (query['accountInfo.userRole'] === 'serv') {
        query['extInfo.yiyangbaoHealInce.inceId'] = req.user._id;
        query['extInfo.domain'] = domain;
    }
    if (query['accountInfo.userRole'] === 'unit') {
        query['extInfo.yiyangbaoHealInce.servId'] = req.user._id;
        query['extInfo.domain'] = domain;
    }
    if (query === 'extInfo.yiyangbaoHealInce.servId') {
        query = {'extInfo.yiyangbaoHealInce.servId': req.user._id};
        query['extInfo.domain'] = domain;
    }
    if (query === 'extInfo.yiyangbaoHealInce.authorizedBy.servId') {
        query = {'extInfo.yiyangbaoHealInce.authorizedBy.servId': req.user._id, 'extInfo.yiyangbaoHealInce.authorizedBy.isRevoked': false};
        query['extInfo.domain'] = domain;
        projection = {
            'extInfo.yiyangbaoHealInce.authorizedBy': 1,
            mobile: 1, 
            'personalInfo.name': 1, 
            'personalInfo.employeeId': 1
        };
    }
    User.getSome(query, function (err, list) {
        if (err) {
            return res.status(500).send(err.errmsg);
        }
            res.json({results: list});            
    }, null, projection || '-password -extInfo.yiyangbaoHealInce.dealPassword -accountInfo.pwdQuestions');
};
exports.getInfo = function (req, res) {
    var query = { 
        _id: req.user._id
    };
    User.getOne(query, function (err, user) {
        if (err) {
            console.log(err);
            return res.status(500).send('服务器错误, 用户查询失败!');
        }
        if (!user) {
            return res.status(404).send('用户不存在!'); 
        }
        res.json({results: user});
    });
};
exports.getAccInfo = function (req, res) {
    var query = { _id: req.user._id };
    if (req.query.idNo) {
        query = {'personalInfo.idNo': req.query.idNo};
    }
    var populate = [{ 
        path: 'unitId',
        select: '-accountInfo -password'
    }, {
        path: 'servId',
        select: '-accountInfo -password'
    }, {
        path: 'inceId',
        select: '-accountInfo -password'
    }];
    User.getOne(query, function (err, user) {
        if (err) {
            return res.status(500).send(err.errmsg);
        }
        if (!user) {
            return res.status(404).send('用户不存在!'); 
        }
        Insurance.getSome({userId: user._id, isSettlement: true}, function (err, inces) {
            if (err) {
                return res.status(500).send(err.errmsg);
            }
            if (!inces) {
                return res.status(404).send('保单不存在!'); 
            }


            //当保单只有一条的时候，只返回一个对象，所以这里要转换成数组
            if (inces.length === undefined) {
                inces = new Array(inces);
            }

            // 多保单下，一个保单里有多个余额结算方式
            var amountInfo = {amount:0, consumed:0, available:0, freeze:0};
            for(var i=0; i < inces.length; i++) {
                
                for(var j=0; j < inces[i].amountDetails.length; j++) {
                    amountInfo.amount +=  parseFloat(inces[i].amountDetails[j].amount);
                    amountInfo.consumed +=  parseFloat(inces[i].amountDetails[j].consumed);
                    amountInfo.available +=  parseFloat(inces[i].amountDetails[j].available);
                    amountInfo.freeze +=  parseFloat(inces[i].amountDetails[j].freeze);
                }
                
            }
            
            var AccInfo = {
                user: user,
                inces: inces,
                amountInfo: amountInfo           
            };
            
            /*AccInfo.ince.available = (ince.available > 0 && ince.available) || ((ince.amount || 0) - (ince.consumed || 0) - (ince.freeze || 0)); 
            if (ince.in) AccInfo.ince.in.available = (ince.in.available > 0 && ince.in.available) || ((ince.in.amount || 0) - (ince.in.consumed || 0) - (ince.in.freeze || 0)); 
            if (ince.out) AccInfo.ince.out.available = (ince.out.available > 0 && ince.out.available) || ((ince.out.amount || 0) - (ince.out.consumed || 0) - (ince.out.freeze || 0)); 

*/
            res.json({results: AccInfo});
        }, null, '_id unitId inceId servId amount seriesNum inceGenNum amountDetails inceType', populate); 
    });
};
exports.getOthersInfo = function (req, res) {
    var query = req.body.query,
        options = req.body.options,
        fields = req.body.fields;
    User.getOne(query, function (err, user) {
        if (err) {
            console.log(err);
            return res.status(500).send('服务器错误, 用户查询失败!');
        }
        if (!user) {
            return res.status(404).send('用户不存在!'); 
        }
        var dealPassword = false;
        if (user.extInfo.yiyangbaoHealInce.dealPassword) {
            dealPassword = true;
        }
        res.json({results: dealPassword});
    }, null, '-username -password -accountInfo');
};
exports.getOthersInfom = function (req, res) {
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');    
    var query = req.body.query,
        options = req.body.options || null;
    if (query.$or) {
        var i, arrLen = query.$or.length;
        for (i = 0; i < arrLen; i++) {
            query.$or[i]['extInfo.domain'] = domain;
        }
    }
    User.getOne(query, function (err, user) {
        if (err) {
            console.log(err);
            return res.status(500).send('服务器错误, 用户查询失败!');
        }
        if (!user) {
            return res.status(404).send('用户不存在!'); 
        }
        res.json({results: user});
    }, options, '-username -password -accountInfo -extInfo.yiyangbaoHealInce.dealPassword');
};
exports.modify = function (req, res) {
    var userObj = req.body.userObj,  
        query = { _id: userObj._id };
    delete userObj._id; 
    User.update(query, userObj, function (err, numberAffected, raw) {
        if (err) {
            return res.status(500).send(err.errmsg);
        }
        res.json({results: {count: numberAffected, raw: raw}});
    });
};
exports.update = function (req, res) {
    var userObj = req.body.userObj || {},
        query = { _id: req.user._id }; 
    User.update(query, userObj, function (err, numberAffected, raw) {
        if (err) {
            return res.status(500).send(err.errmsg);
        }
        res.json({results: {count: numberAffected, raw: raw}});
    });   
};
exports.updateOne = function (req, res) {
    var user = req.body.user || {};
    if (user.mobile && (!req.smsAuth || req.smsAuth[user.mobile] !== config.SMS_Secret)) {
        return res.status(401).send('IP已记录, 别搞破坏!');
    }
    req.assert('user.username', '无效用户名').optional().len(1, 20).isAlphanumeric();
    req.assert(['user', 'email'], '无效邮箱').optional().isEmail();
    req.assert('user.mobile', '无效手机号').optional().isMobilePhone('zh-CN');
    req.assert('user.newMobile', '无效新手机号').optional().isMobilePhone('zh-CN');
    req.assert(['user', 'personalInfo.idNo'], '无效证件号').optional().len(6, 20).isAlphanumeric();
    req.assert('user.personalInfo.birthdate', '无效出生日期').optional().isDate(); 
    var mappedErrors = req.validationErrors(true);
    if (mappedErrors) {
        var errText = '';
        if (mappedErrors['user.username']) errText = mappedErrors['user.username'].msg + '!';
        if (mappedErrors['user.email']) errText = mappedErrors['user.email'].msg + '!';
        if (mappedErrors['user.mobile']) errText = mappedErrors['user.mobile'].msg + '!';
        if (mappedErrors['user.newMobile']) errText = mappedErrors['user.newMobile'].msg + '!';
        if (mappedErrors['user.personalInfo.idNo']) errText = mappedErrors['user.personalInfo.idNo'].msg + '!';
        if (mappedErrors['user.personalInfo.birthdate']) errText = mappedErrors['user.personalInfo.birthdate'].msg + '!';
        return res.status(422).send(errText);
    }
    var option = req.body.option || {},
        query = { _id: req.user._id }; 
    if (req.body.query && req.body.query._id) {
        if (req.body.user['$addToSet']) {
            query = req.body.query;
            user['$addToSet']['extInfo.yiyangbaoHealInce.authorizedBy'].servId = req.user._id;
        }
        if (req.body.user['$set']) {
            query = req.body.query;
            query['extInfo.yiyangbaoHealInce.authorizedBy.servId'] = req.user._id;
        }
        option.select = '-username -password -accountInfo -extInfo.yiyangbaoHealInce.dealPassword';
        if (req.body.query._id === req.user._id) {
            return res.status(422).send('无需给自己授权!');
        }
    }
    option.new = true;
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    var dulQuery = {
        $or: [
            {email: user.email || '@@@@@@', 'extInfo.domain': domain},
            {mobile: user.newMobile || user.mobile || '@@@@@@', 'extInfo.domain': domain},
            {username: user.username || '@@@@@@', 'extInfo.domain': domain}
        ]
    };
    User.getSome(dulQuery, function (err, dulUsers) {
        if (err) {
            return res.status(500).send(err.errmsg);
        }
        if (dulUsers.length > 0) {
            if (dulUsers.length === 1 && dulUsers[0]._id !== req.user._id) {
                var errMsg = '';
                if (user.username && dulUsers[0].username === user.username) {
                    errMsg = '用户名已存在! ';
                }
                if (user.email && dulUsers[0].email === user.email) {
                    errMsg += '邮箱已存在! ';
                }
                if (user.mobile && dulUsers[0].mobile === user.mobile) {
                    errMsg += '手机已存在!';
                }
                return res.status(422).send(errMsg);
            }
            if (dulUsers.length > 1) {
                return res.status(422).send('信息重复!');
            }
        }
        if (user.mobile) {
            delete user.smsType;
            delete user.verify;
            if (user.newMobile) {
                user.mobile = user.newMobile;
                delete user.newMobile;
            }
        }
        User.updateOne(query, user, function (err, user) {
            if (err) {
                return res.status(500).send(err.errmsg);
            }
            if (!user) {
                return res.status(404).send('用户不存在!'); 
            }
            res.json({results: user});
        }, option);
    });
};
exports.updateOneWithSMS = function (req, res) {
    req.assert('newPassword', '无效密码').notEmpty().len(1, 20);
    req.assert('mobile', '无效手机号').notEmpty().isMobilePhone('zh-CN');
    var mappedErrors = req.validationErrors(true);
    if (mappedErrors) {
        var errText = '';
        if (mappedErrors.newPassword) errText += mappedErrors.newPassword.msg + '!';
        if (mappedErrors.mobile) errText = mappedErrors.mobile.msg + '!';
        return res.status(422).send(errText);
    }
    var password = req.body.newPassword,
        password_re = req.body.repeatPwd,
        smsType = req.body.smsType,
        mobile = req.body.mobile,
        targetKey = 'password';
    if (smsType === '-findDealPwd') {
        targetKey = 'extInfo.yiyangbaoHealInce.dealPassword';
    }
    if (password_re != password) {
        return res.status(422).send('两次输入的新密码不一致!');
    }
    if (config.defaultPwd === password) {
        return res.status(422).send('新密码不能为"' + config.defaultPwd + '"!');
    }
    if (!req.smsAuth || req.smsAuth[mobile] !== config.SMS_Secret) {
        return res.status(401).send('IP已记录, 别搞破坏!');
    }
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, ''),
        query = {mobile: mobile, 'extInfo.domain': domain};
    bcrypt.genSalt(config.SALT_WORK_FACTOR, function (err, salt) {
        if (err) {
            return res.status(500).send(err);
        }
        bcrypt.hash(password.toString(), salt, function (err, hash) {
            if (err) {
                return res.status(500).send(err);
            }
            var upObj = {};
            upObj[targetKey] = hash;
            User.updateOne(query, upObj, function (err, user) {
                if (err) {
                    return res.status(500).send(err.errmsg);
                }
                if (!user) {
                    return res.status(404).send('用户不存在!'); 
                }
                res.json({results: user});
            }, {select: '-username -password -accountInfo -personalInfo -extInfo.yiyangbaoHealInce.dealPassword'});
        });
    });
};

exports.updateApiUser = function(req, res) {   

    var userRole = req.user.userRole;
    if ( userRole === 'user') {
        var query = {_id: req.user._id};

        User.getOne(query, function(err, user) {            
            if ( err){
                return res.status(500).send(err.errmsg);
            }
            if (!user) {
                return res.status(404).send('用户不存在!'); 
            }
            var apiname = req.body.apiObj.apiname || 'other';
            /*var upObj = {
                'apiUser.haolinju.userId': req.body.user_id,
                'apiUser.haolinju.loginName': req.body.login_name,
                'apiUser.haolinju.createTime': new Date()
            };*/
            var upObj = {};
            upObj['apiUser.'+ apiname +'.userId'] = req.body.user_id;
            upObj['apiUser.'+ apiname +'.loginName'] = req.body.login_name;
            upObj['apiUser.'+ apiname +'.createTime'] = new Date() ;


            User.updateOne(query, upObj, function(err, user) {
                
                if (err) {
                    return res.status(500).send(err.errmsg);
                }
                if (!user) {
                    return res.status(404).send('用户不存在!'); 
                }

                //res.json({results: user});
                return res.status(200).send('ok');

            }, {select: '-username -password -accountInfo -personalInfo -extInfo'});
        });

    }
};


exports.barCodePay = function(req, res) {
    req.assert('pwd', '无效密码').notEmpty();
    req.assert('amount', '消费金额不能为空').notEmpty();
    req.assert('barcode', '无效码').notEmpty();
    var mappedErrors = req.validationErrors(true);
    if (mappedErrors) {
        var errText = '';
        if (mappedErrors['pwd']) errText = mappedErrors['pwd'].msg + '!';
        if (mappedErrors['barcode']) errText += mappedErrors['barcode'].msg + '!';
        if (mappedErrors['amount']) errText += mappedErrors['amount'].msg + '!';
        return res.status(422).send(errText);
    }
    var userRole = req.user.userRole;
    if ( userRole !== 'user') {
        return res.status(422).send('无操作权限');
    }

    var password = req.body.pwd;
    var amount = parseFloat(req.body.amount || 0);
    var barcode = req.body.barcode;

    var userQuery = {
        _id: req.user._id
    };
    var inceQuery = {
        userId: req.user._id,
        inceType: "3"
    };

    if (barcode.indexOf('ONLP') === 0) {
        var mediId = barcode.substring( barcode.indexOf('|') + 1);
        User.getOne({_id: mediId}, function(err, medi) {
            if (err) {
                return res.status(500).send(err.errmsg);
            }
            if (!medi) {
                return res.status(404).send('未找到商店信息!');
            }

            User.getOne(userQuery, function(err, user) {
                if (err) {
                    return res.status(500).send(err.errmsg);
                }
                if (!user) {
                    return res.status(404).send('用户不存在!');
                }
                var currentTime = new Date();
                var lastLoginFailTime = user.accountInfo.lastLoginFail || currentTime;
                var loginFailTimes = user.accountInfo.loginFailTimes;
                if ( loginFailTimes > 5 && (currentTime.getTime() - lastLoginFailTime.getTime()) < config.delayWhenFailLogin) {
                    return res.status(401).send('请5分钟后重试!');
                }
                if ( loginFailTimes > 5 && (currentTime.getTime() - lastLoginFailTime.getTime()) > config.delayWhenFailLogin) {
                    loginFailTimes--;
                    lastLoginFailTime = currentTime;
                }

                bcrypt.compare(password, user.extInfo.yiyangbaoHealInce.dealPassword, function(err, isMatch) {
                    if ( err) {
                        return res.status(500).send('服务器错误, 密码比对失败!');
                    }
                    
                    if ( !isMatch) {
                        return User.update(userQuery, {
                            'accountInfo.lastLoginFail': lastLoginFailTime,
                            'accountInfo.loginFailTimes': loginFailTimes + 1
                        }, function(err) {
                            if (err) {
                                return res.status(500).send('服务器错误, 登录信息更新错误!');
                            }
                            var errMsg = '密码错误, 还有' + (5 - loginFailTimes) + '次机会!';
                            if (loginFailTimes > 4) {
                                errMsg = '密码输入错误' + (loginFailTimes + 1) + '次, 请5分钟后重试!'
                            }

                            return res.status(401).send(errMsg); 
                        });
                    }

                    var upObj = {
                        'accountInfo.lastLogin': new Date(),
                        'accountInfo.loginTimes': user.accountInfo.loginTimes +1,
                        'accountInfo.loginFailTimes': 0
                    };

                    User.update(userQuery, upObj, function(err) {
                        if (err) {
                            return res.status(500).send('服务器错误, 登录状态更新失败!');
                        }
                        
                        //判断余额
                        Insurance.getOne(inceQuery, function(err, ince) {
                            if ( err) {
                                return res.status(500).send(err.errmsg);
                            }
                            if ( ince) {
                                var available = ince.amountDetails[0].available || 0;
                                if (available < amount) {
                                    return res.status(422).send('余额不足!');
                                }

                                var cons = {
                                    userId: user._id,
                                    money: amount,
                                    consType: 'medi',
                                    note: '',
                                    seriesNum: ince.seriesNum,
                                    inceGenNum: ince.inceGenNum,
                                    'mediType.amountType': ince.amountDetails[0].amountType,
                                    'mediType.amountText': ince.amountDetails[0].amountText,
                                    mediId: medi._id,
                                    incePolicyId: ince._id,
                                    unitId: ince.unitId,
                                    inceId: ince.inceId,
                                    servId: ince.servId,
                                    password: password
                                };

                                var newCons = new Consumption(cons);
                                newCons.save(function(err, cons) {
                                    if (err) {
                                        return res.status(500).send(err.errmsg);
                                    }

                                    var upObj = {
                                        $inc: {
                                            'amountDetails.0.consumed': amount, 
                                            'amountDetails.0.available': -amount
                                        }
                                    };

                                    Insurance.updateOne(inceQuery, upObj, function(err, nInce) {
                                        if (err) {
                                            return res.status(500).send(err.errmsg);
                                        }

                                        res.json({results: 'ok'});

                                    }, {select: 'amount amountDetails _id'});

                                });
                            }
                        });
                    });
                });
            });
        });
    } else {
        return res.status(422).send('未找到商店信息')
    }

};

exports.bindBarcode = function (req, res) {
    req.assert('query', '无效证件号').notEmpty().len(1, 30).isAlphanumeric();
    req.assert('barcode', '无效条码号').notEmpty().len(1, 20).isAlphanumeric();
    var mappedErrors = req.validationErrors(true);
    if (mappedErrors) {
        var errText = '';
        if (mappedErrors['query']) errText = mappedErrors['query'].msg + '!';
        if (mappedErrors['barcode']) errText = mappedErrors['barcode'].msg + '!';
        return res.status(422).send(errText);
    }
    var userRole = req.user.userRole;
    if (userRole !== 'serv' && userRole !== 'user') {
        return res.status(422).send('无操作权限!');
    }
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    if (userRole === 'serv') {
        var query = {
            $or: [
                {email: req.body.query, 'extInfo.domain': domain},
                {mobile: req.body.query, 'extInfo.domain': domain},
                {username: req.body.query, 'extInfo.domain': domain},
                {'personalInfo.idNo': req.body.query, 'extInfo.domain': domain}
            ]
        };
    }
    if (userRole === 'user') {
        var query = {_id: req.user._id};
    }
    User.getOne(query, function (err, user) {
        if (err) {
            return res.status(500).send(err.errmsg);
        }
        if (!user) {
            return res.status(404).send('用户不存在!'); 
        }
        Insurance.getSome({idNo: user.personalInfo.idNo}, function (err, inces) {
            if (err) {
                return res.status(500).send(err.errmsg);
            }
            if (inces.length === 0) {
                return res.status(404).send('保单不存在!'); 
            }
            if (inces.length > 1) {
                var i, len = inces.length, rawInces = [], seriesNums = '';
                for (i = 0; i < len; i++) {
                    inces[i].userId = user._id;
                    if (!inces[i].seriesNum) rawInces.push(inces[i]);
                    else seriesNums += inces[i].seriesNum + '. ';
                }
                if (rawInces.length === 0) return res.status(422).send('用户已绑定卡号: ' + seriesNums);
                return res.json({results: rawInces}); 
            }
            if (!!inces[0].seriesNum) {
                return res.status(422).send('用户已绑定卡号: ' + inces[0].seriesNum);
            }
            Insurance.updateOne({idNo: user.personalInfo.idNo}, {$set: {seriesNum: req.body.barcode, userId: user._id}}, function (err, ince) {
                if (err) {
                    return res.status(500).send(err.errmsg);
                }
                if (!ince) {
                    return res.status(404).send('保单不可能不存在!'); 
                }
                res.json({results: 'OK'});
            });
        });
    });
};
exports.updateOnesPwd = function (req, res) {
        req.assert('oldPassword', '无效旧密码').optional().len(1, 20); 
    req.assert('loginPwd', '无效密码').optional().len(1, 20);
    req.assert('seriesNum', '无效序列号').optional().len(1, 20);
    req.assert('newPassword', '无效密码').notEmpty().len(1, 20);
    var mappedErrors = req.validationErrors(true);
    if (mappedErrors) {
        var errText = '';
        if (mappedErrors.oldPassword) errText += mappedErrors.oldPassword.msg + '!';
        if (mappedErrors.loginPwd) errText += mappedErrors.loginPwd.msg + '!';
        if (mappedErrors.seriesNum) errText += mappedErrors.seriesNum.msg + '!';
        if (mappedErrors.newPassword) errText += mappedErrors.newPassword.msg + '!';
        return res.status(422).send(errText);
    }
    var password = req.body.newPassword,
        password_re = req.body.repeatPwd,
        loginPwd = req.body.loginPwd,
        seriesNum = req.body.seriesNum,
        oldPassword = req.body.oldPassword,
        targetKey = req.body.targetKey;
    if (password_re != password) {
        return res.status(422).send('两次输入的新密码不一致!');
    }
    if (config.defaultPwd === password) {
        return res.status(422).send('新密码不能为"' + config.defaultPwd + '"!');
    }
    if (oldPassword === password) {
        return res.status(422).send('新密码和旧密码相同!');
    }
    var query = { _id: req.user._id }; 
    if (loginPwd && req.user.userRole === 'medi' && seriesNum) { 
        query = {
            seriesNum: seriesNum
        };
        if (targetKey === 'password' && loginPwd === password) {
            return res.status(422).send('新密码和旧密码相同!');
        }
        return Insurance.getOnePopulated(query, 'userId', function (err, ince) {
            if (err) {
                return res.status(500).send(err.errmsg);
            }
            if (!ince) {
                return res.status(404).send('用户保单不存在!'); 
            }
            var user = ince.userId;
            query = {
                _id: user._id
            };
            var currentTime = new Date();
            var lastLoginFailTime = user.accountInfo.lastLoginFail || currentTime;
            var loginFailTimes = user.accountInfo.loginFailTimes;
            if (loginFailTimes > 5 && (currentTime.getTime() - lastLoginFailTime.getTime()) < config.delayWhenFailLogin) {
                return res.status(401).send('请5分钟后重试!');
            }
            if (loginFailTimes > 5 && (currentTime.getTime() - lastLoginFailTime.getTime()) > config.delayWhenFailLogin) {
                loginFailTimes--;
                lastLoginFailTime = currentTime;
            }
            bcrypt.compare(loginPwd.toString(), user.password, function (err, isMatch) {
                if (err) {
                    return res.status(500).send(err.errmsg);
                }
                if (!isMatch) {
                    return User.update(query, { 
                        'accountInfo.lastLoginFail': lastLoginFailTime,
                        'accountInfo.loginFailTimes': loginFailTimes + 1
                    }, function (err) {
                        if (err) {
                            return res.status(500).send('服务器错误, 登录信息更新错误!');
                        }
                        var errMsg = '密码错误, 还有' + (5 - loginFailTimes) + '次机会!';
                        if (loginFailTimes > 4) {
                            errMsg = '密码输入错误' + (loginFailTimes + 1) + '次, 请5分钟后重试!'
                        }
                        return res.status(401).send(errMsg); 
                    });
                }
                var upObj = {
                    'accountInfo.lastLogin': new Date(),
                    'accountInfo.loginTimes': user.accountInfo.loginTimes + 1,
                    'accountInfo.loginFailTimes': 0
                };
                bcrypt.genSalt(config.SALT_WORK_FACTOR, function (err, salt) {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    bcrypt.hash(password.toString(), salt, function (err, hash) {
                        if (err) {
                            return res.status(500).send(err);
                        }
                        upObj[targetKey] = hash;
                        User.updateOne(query, upObj, function (err, user) {
                            if (err) {
                                return res.status(500).send(err.errmsg);
                            }
                            if (!user) {
                                return res.status(404).send('用户不存在!'); 
                            }
                            res.json({results: user});
                        }, {select: '-username -password -accountInfo -extInfo.yiyangbaoHealInce.dealPassword'});
                    });
                }); 
            });
        });
    }
    User.getOne(query, function (err, user) {
        if (err) {
            return res.status(500).send(err.errmsg);
        }
        var pathArray = targetKey.split('.');
        var targetVal = user;
        for (var i = 0; i < pathArray.length; i++) {
            targetVal = targetVal[pathArray[i]];
        }
        if (!oldPassword || !targetVal) { 
            oldPassword = config.defaultPwd;
            targetVal = config.defaultHash;
        }
        if (req.user.reset) { 
            oldPassword = config.defaultPwd;
            targetVal = config.defaultHash;
        }
        bcrypt.compare(oldPassword.toString(), targetVal, function (err, isMatch) {
            if (err) {
                return res.status(500).send(err);
            }
            if (!isMatch) {
                return res.status(401).send('密码错误!');
            }
            bcrypt.genSalt(config.SALT_WORK_FACTOR, function (err, salt) {
                if (err) {
                    return res.status(500).send(err);
                }
                bcrypt.hash(password.toString(), salt, function (err, hash) {
                    if (err) {
                        return res.status(500).send(err);
                    }
                    var upObj = {};
                    upObj[targetKey] = hash;
                    User.updateOne(query, upObj, function (err, user) {
                        if (err) {
                            return res.status(500).send(err.errmsg);
                        }
                        if (!user) {
                            return res.status(404).send('用户不存在!'); 
                        }
                        res.json({results: user});
                    }, {select: '-username -password -accountInfo -extInfo.yiyangbaoHealInce.dealPassword'});
                });
            }); 
        });
    });
};
exports.remove = function (req, res) {
    res.status(200).send('Removed OK!');
    var users = req.body.users;
    var i, arrLen = users.length;
    for (i = 0; i < arrLen; i++) {
        users[i]['accountInfo.isActive'] = false;
    }
    var query = {
        $or: users
    };
    User.remove(query, function (err) {
        if (err) {
            console.log(err);
        }
    });
};
exports.removeOne = function (req, res) {
    var query = { _id: req.query._id, 'personalInfo.idNo': req.query.idNo,'accountInfo.isActive': false  };
    req.query._id || delete query._id;
    req.query.idNo || delete query['personalInfo.idNo'];
    User.removeOne(query, function (err, user) {
        if (req.removeRes) {
            return res.json({results: req.removeRes.inceResults});
        }
        if (err) {
            return res.status(500).send(err.errmsg);
        }
        if (user) {
            return res.json({results: {_id: user._id}});
        }
        res.status(422).send('用户已激活, 不能删除!');
    });
};
exports.logout = function (req, res) {
    if (req.user) {
        tokenManager.expireToken(req);
        delete req.user;
    }   
    res.sendStatus(200);
};
exports.onMine = function (req, res) {
    var url = req.protocol + '://' + req.get('host') + '/reg/' + req.session.user._id;
    codes.loadModules(['qrcode'], {'eclevel': 'M', 'version': '4', 'scaleX': 2.5, 'scaleY': 2.5});  
    var data = codes.create('qrcode', url);
    var recommReg = {
        location_url: url,
        barcode_url: 'data:image/png;base64,' + data.toString('base64')
    };
    res.render('mine', {
        title: '我的',
        user: req.session.user,
        pwdQuestions: config.pwdQuestions,
        userLeveldown: config.userLeveldown,
        recommReg: recommReg,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
};
