var settings = require('../../../../settings.js').webEntry,
    config = require('../../../../config.js'),
    XLSX = require('xlsx'),
    jwt = require('jsonwebtoken'),
    request = require('request');

var workbook = XLSX.readFile('drug.xlsx');
var data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

// console.log(data);

request.post({  
    url: 'http://' + settings.domainName + '/user/login',
    form: {
        username: 'm',
        password: 'a',
        rememberme: true
    }
}, function(err, res, body) {
    // console.log(17, body);
    //获得Token
    var token = JSON.parse(body).results.token;

    // console.log(jwt.decode(token, {json: true}));
    // console.log(data[0]);

    request.post({
        url: 'http://' + settings.domainName + '/drug/bulkInsert',
        headers: { Authorization: 'Bearer ' + token },
        json: {  // 这里不能用form, 因为会设置Content-type: application/x-www-form-urlencoded, 造成2m的限制, data超过2m时, 就报错 cannot post
            drugs: data
        }
        // body: {  // 和上面直接用json等价, 注意下面的json: true
        //     drugs: data
        // }
        // json: true
    }, function(err, res, body) {
        console.log(0, body);
    });
});

