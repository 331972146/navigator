angular.module('yiyangbao.filters', [])
.filter('postType', function() {
    var postTypeHash = {
        161: '保险产品',
        162: '挂号就诊',
        163: '名家养生'
    };

    return function(input) {
        if ( !input && input !== 0) {
            return '其他';
        } else {
            return postTypeHash[input] || '其他';
        }
    };
})
.filter('mapGender', function () {
    var genderHash = {
        1: '男',
        2: '女',
        3: '未知',
        4: '未申明',
        5: '其他',
        '男': '男',
        '女': '女',
        male: '男',
        female: '女'
    };
    return function (input) {
        if (!input) {
            return '未知';
        } else {
            return genderHash[input] || '未知';
        }
    };
})
.filter('address', function () {
    return function (input) {
        return input.street + ', ' + input.district.name + ', ' + input.city.name + ', ' + input.state.name + ', ' + input.zip;
    };
})
.filter('mapSize', function () {
    var sizeHash = {
        1: 'SM',
        2: 'M',
        3: 'L',
        4: 'XL',
        5: 'XXL',
        6: '8',
        7: '10',
        8: '12',
        9: '14',
        10: '16'
    };
    return function (input) {
        if (!input) {
            return '';
        } 
        else {
            return sizeHash[input];
        }
    };
})
.filter('mapInceType', function () {
    var inceTypeHash = {
        1: '补充医疗保险',
        2: '高端医疗保险',
        4: '养老金保险',
        5: '医疗金保险'
    };
    return function (input) {
        if (!input) {
            return '其他';
        } else {
            return inceTypeHash[input] || '其他';
        }
    };
})
.filter('boolean', function () {
    var booleanHash = {
        true: '是',
        false: '否'
    };
    return function (input) {
        if (!input) {
            return '否';
        } else {
            return booleanHash[input] || '否';
        }
    };
})
.filter('mapDomain', function () {
    var domainHash = {
        'e.net': '会员',
        'net': '会员'
    };
    return function (input) {
        if (!input) {
            return '会员';
        } else {
            return domainHash[input] || '会员';
        }
    };
})
.filter('mapUserRole', function () {
    var roleHash = {
        'serv': '服务专员',
        'medi': '医药机构',
        'user': '投保用户',
        'unit': '投保单位',
        'ince': '保险公司',
        'admin': '管理员'
    };
    return function (input) {
        if (!input) {
            return '投保用户';
        } else {
            return roleHash[input] || '投保用户';
        }
    };
})
.filter('yiyangNo', function () {
    return function (input) {
        if (!input) {
            return '空';
        } else {
            if (input.indexOf(')|(') > -1) return '动态二维码';
            return input;
        }
    };
})
;