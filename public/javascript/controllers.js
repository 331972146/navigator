angular.module('yiyangbao.controllers', [])
.controller('main', ['$scope', function ($scope) {
}])
.controller('aboutus', ['$scope', '$window', '$sce', '$location', function ($scope, $window, $sce, $location) {
    var callback = function (obj) {
        alert(obj.message);
    };
    var url = $location.protocol() + '://' + $location.host() + ':' + $location.port() + '/';
    $scope.barcode = url + 'utilities/downloadApp/download.html'; 
    $scope.barcodeZbtong = url + 'utilities/downloadZbtong/download.html'; 
    var intro = $sce.trustAsHtml('<h2 class="text-center">简介</h2><div class="text-indent text-wrap"></div><div class="center-block padding-top-3 container-fluid"><div class="col-md-6 col-xs-12"><img src="/res/img/wearable.jpg" class="img-responsive"></div><div class="col-md-6 col-xs-12"><img src="/res/img/wearable2.jpg" class="img-responsive"></div></div>');
    var contact = $sce.trustAsHtml('<address class="padding-top-3"><strong>公司</strong><br><br><abbr title="联系电话">电话:</abbr> </address>');


    var productHtml = '<div class="row">'+
                '    <h2 class="text-center">APP下载</h2>'+
                '    <div class="col-md-11 col-xs-11">'+
                '    <a href="itms-services://?action=download-manifest&url=https://' + $location.host() + ':443/utilities/iosApp/yyb.plist">'+
                '    <img alt="" src="/res/img/ios.jpg"  class="img-responsive">'+
                '    </a>'+
                '    </div>'+
                '    <div class="col-md-11 col-xs-11">'+
                '    <a href="http://17f.xy.net/app/yyb.apk">'+
                '    <img alt="" src="/res/img/android.jpg" class="img-responsive">'+
                '    </a>'+
                '    </div>'+
                '    <qrcode version="{{5}}" error-correction-level="{{\'M\'}}" size="{{120}}" data="{{barcode}}" ng-if="barcode" class="fix-right"></qrcode>'+
                '</div>';

    productHtml += '<div class="row">'+
                '    <h2 class="text-center">浙保通APP下载</h2>'+
                '    <div class="col-md-11 col-xs-11">'+
                '    <a href="itms-services://?action=download-manifest&url=https://' + $location.host() + ':443/utilities/iosApp/zbtong.plist">'+
                '    <img alt="" src="/res/img/ios.jpg"  class="img-responsive">'+
                '    </a>'+
                '    </div>'+
                '    <div class="col-md-11 col-xs-11">'+
                '    <a href="http://17f.xy.net/app/zbtong.apk">'+
                '    <img alt="" src="/res/img/android.jpg" class="img-responsive">'+
                '    </a>'+
                '    </div>'+
                '    <qrcode version="{{5}}" error-correction-level="{{\'M\'}}" size="{{120}}" data="{{barcodeZbtong}}" ng-if="barcodeZbtong" class="fix-right-2"></qrcode>' +
                '  </div>';

    var product = $sce.trustAsHtml(productHtml);



    var agreement = $sce.trustAsHtml('<h2 class="text-center">用户协议</h2>');
    $scope.tabs = [
        { title: '公司介绍', content: intro, active: true },
        { title: '公司产品', content: product },
        { title: '联系我们', content: contact },
        { title: '用户协议', content: agreement }//,
    ];
}])
.controller('register', ['$scope', 'Data', function ($scope, Data) {
	Data.Interface.captchaImg(function (data){
		$scope.captchaImg = data.data;
	});
	$scope.getCaptcha = function () {
		Data.Interface.captchaImg(function (data){
			$scope.captchaImg = data.data;
		});
	};
}])
.controller('login', ['$scope', 'User', 'Token', '$state', 'Session', function ($scope, User, Token, $state, Session) {
    $scope.state = {
        fromStateName: 'anon.login'
    };
    $scope.actions = {
        login: function () {
            User.login($scope);
        },
        logout: function () {
            User.logout($scope);
        }
    };
    $scope.isLoggedIn = false;
    if (!Token.isExpired() || Session.get('refreshToken')) {
        User.getInfo(Session.get('token')).then(function (data) {
            var personalInfo = data.results.personalInfo || {};
            $scope.fullname = personalInfo.name || data.results.username;
            var gender = '用户';
            switch (personalInfo.gender) {
                case 1: 
                    gender = '先生';
                    break;
                case 2:
                    gender = '女士';
                    break;
            }
            $scope.gender = gender;
            $scope.isLoggedIn = true;
        }, function (err) {
            $scope.error = err.data;
        });
    }
    $scope.login = {
        username: '',
        password: '',
        rememberme: true
    };
}])
.controller('homepage', ['$scope', 'User', 'Token', '$state', 'Session', function ($scope, User, Token, $state, Session) {
    $scope.stateUrl = 'homepage';
}])
.controller('pharmacy', ['$scope', function ($scope) {
    $scope.stateUrl = 'pharmacy';
}])
.controller('healthreserve', ['$scope', function ($scope) {
    $scope.stateUrl = 'healthreserve';
}])
.controller('examreserve', ['$scope', function ($scope) {
    $scope.stateUrl = 'examreserve';
}])
.controller('vipmedical', ['$scope', function ($scope) {
    $scope.stateUrl = 'vipmedical';
}])
.controller('mobimedical', ['$scope', function ($scope) {
    $scope.stateUrl = 'mobimedical';
}])
.controller('healthwiki', ['$scope', function ($scope) {
    $scope.stateUrl = 'healthwiki';
}])
.controller('userhome', ['$scope', 'User', function ($scope, User) {
    $scope.stateUrl = 'userhome';
}])
.controller('header', ['$scope', 'User', 'Token', '$state', 'Session', 'Auth', 'ACL', function ($scope, User, Token, $state, Session, Auth, ACL) {
    $scope.actions = {
        logout: function () {
            User.logout($scope);
        }
    };
    $scope.selected = {title: '全部', code: 'all'};
    $scope.access = {
        user: Auth.authorize(ACL.accessLevels.user),
        userOnly: Auth.authorize(ACL.accessLevels.userOnly),
        serv: Auth.authorize(ACL.accessLevels.serv),
        medi: Auth.authorize(ACL.accessLevels.medi),
        ince: Auth.authorize(ACL.accessLevels.ince),
        unit: Auth.authorize(ACL.accessLevels.unit),
        admin: Auth.authorize(ACL.accessLevels.admin)
    };
    if (!Token.isExpired() || Session.get('refreshToken')) {
        if (Session.get('fullname') && Session.get('gender')) {
            $scope.fullname = Session.get('fullname');
            $scope.gender = Session.get('gender');
        }
        else {
            User.getInfo(Session.get('token')).then(function (data) {
                var personalInfo = data.results.personalInfo || {};
                $scope.fullname = personalInfo.name || data.results.username;
                var gender = '用户';
                switch (personalInfo.gender) {
                    case 1: 
                        gender = '先生';
                        break;
                    case 2:
                        gender = '女士';
                        break;
                }
                $scope.gender = gender;
                Session.set('fullname', $scope.fullname);
                Session.set('gender', $scope.gender);
            }, function (err) {
                $scope.error = err.data;
                Session.rm('fullname');
                Session.rm('gender');
            });
        }
    }
}])
.controller('footer', ['$scope', function ($scope) {
}])
;