// Ionic Starter App
var dependencies = ['ui.bootstrap',
                    'ui.router',
                    'btford.socket-io',
                    'monospaced.qrcode',
                    'ngAnimate', 
                    'ngTouch',
                    'ngSanitize',
                    'ui.grid',
                    'ui.grid.edit', 
                    'ui.grid.rowEdit',
                    'ui.grid.autoResize',
                    'ui.grid.resizeColumns',
                    'ui.grid.moveColumns',
                    'ui.grid.selection', 
                    'ui.grid.exporter',
                    'ui.grid.importer',
                    'ui.grid.saveState',
                    'ui.grid.infiniteScroll',
                    'ui.grid.pagination',
                    'w5c.validator',
                    'angular-jwt',
                    'ng.ueditor',
                    'ngFileUpload', 
                    'angular-md5',
                    'yiyangbao.services',
                    'yiyangbao.directives',
                    'yiyangbao.filters',
                    'yiyangbao.controllers.backend',
                    'yiyangbao.controllers.modal',
                    'yiyangbao.controllers'];
var app = angular.module('yiyangbao', dependencies);
app
.config(['$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', '$locationProvider', '$provide', 'CONFIG', function ($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider, $provide, CONFIG) {
    var ACL = function () {
        /*
        * Method to build a distinct bit mask for each role
        * It starts off with "1" and shifts the bit to the left for each element in the
        * roles array parameter
        */
        function buildRoles (roles) {
            var bitMask = "01";
            var userRoles = {};
            for (var role in roles) {
                var intCode = parseInt(bitMask, 2);
                userRoles[roles[role]] = {
                    bitMask: intCode,
                    title: roles[role]
                };
                bitMask = (intCode << 1 ).toString(2);
            }
            return userRoles;
        }
        /*
        * This method builds access level bit masks based on the accessLevelDeclaration parameter which must
        * contain an array for each access level containing the allowed user roles.
        */
        function buildAccessLevels (accessLevelDeclarations, userRoles) {
            var accessLevels = {}, resultBitMask;
            for (var level in accessLevelDeclarations) {
                if (typeof accessLevelDeclarations[level] == 'string') {
                    if (accessLevelDeclarations[level] == '*') {
                        resultBitMask = '';
                        for (var r in userRoles) {
                            resultBitMask += "1";
                        }
                        accessLevels[level] = {
                            bitMask: parseInt(resultBitMask, 2)
                        };
                    }
                    else console.log("Access Control Error: Could not parse '" + accessLevelDeclarations[level] + "' as access definition for level '" + level + "'");
                }
                else {
                    resultBitMask = 0;
                    for (var role in accessLevelDeclarations[level]) {
                        if (userRoles.hasOwnProperty(accessLevelDeclarations[level][role])) resultBitMask = resultBitMask | userRoles[accessLevelDeclarations[level][role]].bitMask;
                        else console.log("Access Control Error: Could not find role '" + accessLevelDeclarations[level][role] + "' in registered roles while building access for '" + level + "'");
                    }
                    accessLevels[level] = {
                        bitMask: resultBitMask
                    };
                }
            }
            return accessLevels;
        }
        var userRoles = buildRoles(CONFIG.userRoles);
        var accessLevels = buildAccessLevels(CONFIG.accessLevels, userRoles);
        return {
            userRoles: userRoles,
            accessLevels: accessLevels
        };
    };
    var acl = ACL();
    var access = acl.accessLevels;
    $provide.service('ACL', function () { 
        return acl;
    });
    $urlMatcherFactoryProvider.strictMode(false);
    $urlRouterProvider.otherwise('/login'); 
    $stateProvider
        .state('public', {
            abstract: true,
            template: "<ui-view/>",
            data: {
                access: access.public
            }
        })
        .state('public.aboutus', {
            url: '/aboutus',
            templateUrl: 'partials/main/aboutus.html',
            controller: 'aboutus'
        })
        .state('public.404', {
            url: '/404',   
            templateUrl: 'partials/common/404.html'
        });
    $stateProvider
        .state('anon', {
            abstract: true,
            template: "<ui-view/>",
            data: {
                access: access.anon
            }
        })
        .state('anon.login', {
            url: '/login',
            templateUrl: 'partials/common/login.html',
            controller: 'login'
        })
        .state('anon.register', {
            url: '/register/',
            templateUrl: 'register',
            controller: 'register'
        });
    $stateProvider
        .state('user', {
            abstract: true,
            template: "<ui-view/>",
            data: {
                access: access.user
            }
        })
        .state('user.homepage', {
            url: '/homepage',
            templateUrl: 'partials/main/homepage.html',
            controller: 'homepage'
        })
        .state('user.pharmacy', {
            url: '/pharmacy',
            templateUrl: 'partials/main/pharmacy.html',
            controller: 'pharmacy'
        })
        .state('user.healthreserve', {
            url: '/healthreserve',
            templateUrl: 'partials/main/healthreserve.html',
            controller: 'healthreserve'
        })
        .state('user.examreserve', {
            url: '/examreserve',
            templateUrl: 'partials/main/examreserve.html',
            controller: 'examreserve'
        })
        .state('user.vipmedical', {
            url: '/vipmedical',
            templateUrl: 'partials/main/vipmedical.html',
            controller: 'vipmedical'
        })
        .state('user.mobimedical', {
            url: '/mobimedical',
            templateUrl: 'partials/main/mobimedical.html',
            controller: 'mobimedical'
        })
        .state('user.healthwiki', {
            url: '/healthwiki',
            templateUrl: 'partials/main/healthwiki.html',
            controller: 'healthwiki'
        })
        .state('user.userhome', {
            url: '/userhome',
            templateUrl: 'partials/main/userhome.html',
            controller: 'userhome',
            data: {
                access: access.userOnly
            }
        })
        .state('user.private', {
            abstract: true,
            url: '/private/',
            templateUrl: 'private/layout'
        })
        .state('user.private.home', {
            url: '',
            templateUrl: 'private/home'
        })
        .state('user.private.nested', {
            url: 'nested/',
            templateUrl: 'private/nested'
        })
        .state('user.private.admin', {
            url: 'admin/',
            templateUrl: 'private/nestedAdmin',
            data: {
                access: access.admin
            }
        });
    $stateProvider
        .state('serv', {
            abstract: true,
            template: "<ui-view/>",
            data: {
                access: access.serv
            }
        })
        .state('serv.servhome', {
            url: '/servhome',
            templateUrl: 'partials/backend/servhome.html',
            controller: 'servhome'
        });
    $stateProvider
        .state('ince', {
            abstract: true,
            template: "<ui-view/>",
            data: {
                access: access.ince
            }
        })
        .state('ince.incehome', {
            url: '/incehome',
            templateUrl: 'partials/backend/incehome.html',
            controller: 'incehome'
        });
    $stateProvider
        .state('medi', {
            abstract: true,
            template: "<ui-view/>",
            data: {
                access: access.medi
            }
        })
        .state('medi.medihome', {
            url: '/medihome',
            templateUrl: 'partials/backend/medihome.html',
            controller: 'medihome'
        });
    $stateProvider
        .state('unit', {
            abstract: true,
            template: "<ui-view/>",
            data: {
                access: access.unit
            }
        })
        .state('unit.unithome', {
            url: '/unithome',
            templateUrl: 'partials/backend/unithome.html',
            controller: 'unithome'
        });
    $stateProvider
        .state('admin', {
            abstract: true,
            template: "<ui-view/>",
            data: {
                access: access.admin
            }
        })
        .state('admin.adminhome', {
            url: '/admin',
            templateUrl: 'partials/backend/admin.html',
            controller: 'admin'
        })
        .state('super', { 
            abstract: true,
            template: "<ui-view/>",
            data: {
                access: access.admin
            }
        })
        .state('super.superhome', { 
            url: '/super',
            templateUrl: 'partials/backend/admin.html',
            controller: 'admin'
        });
}])
.config(['$httpProvider', 'jwtInterceptorProvider', 'SessionProvider', function ($httpProvider, jwtInterceptorProvider, SessionProvider) {
    jwtInterceptorProvider.tokenGetter = ['config', 'jwtHelper', '$http', 'CONFIG', 'Session', function(config, jwtHelper, $http, CONFIG, Session) {
        var token = Session.get('token');
        var refreshToken = Session.get('refreshToken');
        if (!token && !refreshToken) {
            return null;
        }
        var isExpired = true;
        try {
            isExpired = jwtHelper.isTokenExpired(token);
        }
        catch (e) {
            isExpired = true;
        }
        if (config.url.substr(config.url.length - 5) === '.html' || config.url.substr(config.url.length - 3) === '.js' || config.url.substr(config.url.length - 4) === '.css' || config.url.substr(config.url.length - 4) === '.jpg' || config.url.substr(config.url.length - 4) === '.png' || config.url.substr(config.url.length - 4) === '.ico' || config.url.substr(config.url.length - 5) === '.woff') { 
            return null;
        } 
        else if (isExpired) {   
            if (refreshToken && refreshToken.length >= 16) { 
                return $http({
                    url: CONFIG.baseUrl + 'refreshToken',
                    skipAuthorization: true,
                    method: 'POST',
                    timeout: 5000,
                    data: { 
                        grant_type: 'refresh_token',
                        refresh_token: refreshToken 
                    }
                }).then(function (res) {
                    Session.set('token', res.data.token);
                    Session.set('tokenExt', res.data.tokenExt);
                    Session.set('refreshToken', res.data.refreshToken);
                    return res.data.token;
                }, function (err) {
                    console.log(err);
                    return null;
                });
            }
            else {
                Session.rm('refreshToken'); 
                return null;
            }  
        }
        else {
            return token;
        }
    }];
    $httpProvider.interceptors.push('jwtInterceptor');
}])
.config(['w5cValidatorProvider', function (w5cValidatorProvider) {
    w5cValidatorProvider.config({
        blurTrig   : false,
        showError  : true,
        removeError: true
    });
    w5cValidatorProvider.setRules({
        email: { 
            required : "邮箱地址不能为空",
            email    : "输入邮箱的格式不正确"
        },
        username: {
            required : "输入的用户名不能为空",
            pattern  : "用户名必须输入字母、数字、下划线,以字母开头"
        },
        password: {
            required : "密码不能为空",
            minlength: "密码长度不能小于{minlength}",
            maxlength: "密码长度不能大于{maxlength}"
        },
        repeatPassword: {
            required : "密码不能为空",
            repeat: "两次填写的密码不一致"
        },
        name : {
            required : "姓名不能为空",
            pattern  : "请正确输入中文姓名"
        },
        mobile: {
            required : "手机号不能为空",
            pattern  : "请填写正确手机号",
            minlength: "手机号长度不能小于{minlength}",
            maxlength: "手机号长度不能大于{maxlength}"
        },
        tel: {
            pattern  : "请填写正确电话号",
            minlength: "电话号长度不能小于{minlength}",
            maxlength: "电话号长度不能大于{maxlength}"
        },
        idNo: {
            required : "证件号不能为空",
            pattern  : "请填写正确证件号",
            minlength: "证件号长度不能小于{minlength}",
            maxlength: "证件号长度不能大于{maxlength}"
        }
    });
}])
.run(['$rootScope', '$state', 'Auth', 'ACL', 'Token', 'User', 'Session', 'Storage', 'PageFunc', function ($rootScope, $state, Auth, ACL, Token, User, Session, Storage, PageFunc) {
  $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
    if (!('data' in toState) || !('access' in toState.data)){
      event.preventDefault();
      PageFunc.message('当前内容建设中, 敬请期待!', 2000);
      $state.go(fromState.name || 'anon.login');
    }
    else if (Auth.authorize(toState.data.access) && 
            !Auth.isLoggedIn() && 
            !Session.get('refreshToken') && 
            toState.data.access.bitMask !== ACL.accessLevels.public.bitMask && 
            toState.data.access.bitMask !== ACL.accessLevels.anon.bitMask) {
        event.preventDefault();
        $rootScope.state = {
          toStateName: toState.name,
          fromStateName: fromState.name
        };
        User.loginModal($rootScope);
    }
    else if (!Auth.authorize(toState.data.access)) {
      event.preventDefault(); 
        if (Auth.isLoggedIn()) {
          PageFunc.message('页面不存在或不能浏览!', 2000);
          $state.go(fromState.name || 'user.homepage');
        } 
        else {
          $rootScope.state = {
            toStateName: toState.name,
            fromStateName: fromState.name
          };
          User.loginModal($rootScope);
        }
    }
  });
}])
;
