var settings = require('../../../../settings.js').webEntry,
    config = require('../../../../config.js'),
    mongoose = require('mongoose'),
    User = require('../../../../models/user'),
    db = mongoose.connection;

mongoose.connect('mongodb://localhost:27017/mongodb');

db.on('error', function (err) {
    console.log(err);
});

db.once('open', function () {
    // yay!
    console.log(settings.domainName || 'local' + ' MongoDB: init.js');
    var newUser = new User({
        username: 'a',
        password: '$2a$10$es4EN4yFfRo0PS40p1TY2uUKpNMOc37kJm961.T7Q531.WYs5nih6',  // a
        email: 'alexgzhou@xy.net',
        mobile: '13282037883',
        personalInfo: {
            name: 'ABC',
            idType: '身份证',
            idNo: '330283198307050011'
        },
        accountInfo: {
            isActive: false,
            createTime: new Date(),
            lastLogin: null,
            loginTimes: 0,
            lastLoginFail: null,
            loginFailTimes: 0,
            userRole: 'super'
        },
        extInfo: {
            yiyangbaoHealInce: {
                userType: 'super'
            },
            // host: '192.168.1.108',  // settings.domainName,
            // domain: '168.1.108'  // settings.domain
            host: settings.domainName,
            domain: settings.domain
        }
    });

    // console.log(newUser);

    newUser.save(function (err, user) {
        if (err) {
            return console.log(err);
        }

        console.log(user);
        process.exit();
        return;
    });
});