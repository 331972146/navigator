angular.module('yiyangbao.services', ['ngResource'])
.constant('CONFIG', {
  baseUrl: '/',
  ioDefaultNamespace: 'app.xy.net/default',
  jiuzhou: 'http://192.168.1.108:3005/',
  uploadPath: 'multer/upload',
  resUploadPath: 'multer/upload',
  postUploadPath: 'post/resUpload',
  uploadImageType: 'jpg',
  showTime: 500,
	/* List all the roles you wish to use in the app
	* You have a max of 31 before the bit shift pushes the accompanying integer out of
	* the memory footprint for an integer
	*/
	userRoles: [
		'public',
    'user',
    'serv',
    'unit',
    'medi',
    'ince',
    'admin',
    'super'
	],
	/* Build out all the access levels you want referencing the roles listed above
	* You can use the "*" symbol to represent access to all roles.
	* The left-hand side specifies the name of the access level, and the right-hand side
	* specifies what user roles have access to that access level. E.g. users with user role
	* 'user' and 'admin' have access to the access level 'user'.
	*/
	accessLevels: {
		'public': "*",
    'anon': ['public'],
    'userOnly': ['user', 'admin', 'super'],
    'user': ['user', 'admin', 'super', 'serv', 'unit', 'medi', 'ince'],
    'serv': ['serv', 'super'],
    'unit': ['unit', 'super'],
    'medi': ['medi', 'super'],
    'ince': ['ince', 'super'],
    'admin': ['admin', 'super']
	}
})
.factory('Storage', ['$window', function ($window) {
	return {
    set: function(key, value) {
    	$window.localStorage.setItem(key, value);
    },
    get: function(key) {
    	return $window.localStorage.getItem(key);
    },
    rm: function(key) {
    	$window.localStorage.removeItem(key);
    },
    clear: function() {
    	$window.localStorage.clear();
    }
	};
}])
.factory('Session', ['$window', function ($window) {
	return {
    set: function(key, value) {
    	$window.sessionStorage.setItem(key, value);
    },
    get: function(key) {
    	return $window.sessionStorage.getItem(key);
    },
    rm: function(key) {
    	$window.sessionStorage.removeItem(key);
    },
    clear: function() {
    	$window.sessionStorage.clear();
    }
	};
}])
.factory('Token', ['Session', 'jwtHelper', 'ACL', function (Session, jwtHelper, ACL) {
  return {
    curUserRole: function () {
      var userRole = ACL.userRoles.public.title;
      try {
        userRole = jwtHelper.decodeToken(Session.get('token')).userRole;
      }
      catch (e) {
        return ACL.userRoles.public.title;
      }
      return userRole;
    },
    isExpired: function () {
      var isExpired = true;
      try {
        isExpired = jwtHelper.isTokenExpired(Session.get('token'));
      }
      catch (e) {
        return true;
      }
      return isExpired;
    },
    userPayload: function () {
      var payload;
      try {
        payload = jwtHelper.decodeToken(Session.get('token'));
      }
      catch (e) {
        return {};
      }
      return payload;
    },
    thirdParty: function () {
      var payload;
      try {
        payload = jwtHelper.decodeToken(Session.get('tokenExt'));
      }
      catch (e) {
        return {};
      }
      return payload;
    }
  };
}])
.factory('Socket', ['socketFactory', 'CONFIG', function (socketFactory, CONFIG) {
  var self = this;
  var ioSocket = io.connect(CONFIG.baseUrl + CONFIG.ioDefaultNamespace);
  self.default = socketFactory({
    ioSocket: ioSocket
  });
  self.new = function () {
    ioSocket = io.connect(CONFIG.baseUrl + CONFIG.ioDefaultNamespace);
    console.log(CONFIG.baseUrl + CONFIG.ioDefaultNamespace);
    self.default = socketFactory({
      ioSocket: ioSocket
    });
  };
  self.getSocket = function () {
    return ioSocket;
  };
  return self;
}])
.factory('Data', ['$resource', '$q', 'CONFIG', '$interval', function ($resource, $q, CONFIG, $interval) {
  var self = this;
  var abort = $q.defer();
  var User = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
  		path:'user',
    }, {
      bulkInsert: {method:'POST', params:{route: 'bulkInsert'}},
      yljInsert: {method:'POST', params:{route: 'yljInsert'}},
      insertOne: {method:'POST', params:{route: 'insertOne'}, timeout: 10000},
    	login: {method:'POST', params:{route: 'login'}, timeout: 10000},
      getList: {method:'POST', params:{route: 'getList'}, timeout: abort.promise},
    	getInfo: {method:'GET', params:{route: 'getInfo'}, timeout: 10000},
      getOthersInfom: {method:'POST', params:{route: 'getOthersInfom'}, timeout: 10000},
      modify: {method:'POST', params:{route: 'modify'}, timeout: 10000},
      updateOne: {method:'POST', params:{route: 'updateOne'}, timeout: 10000},
      updateOnesPwd: {method:'POST', params:{route: 'updateOnesPwd'}, timeout: 10000},
      remove: {method:'POST', params:{route: 'remove'}, timeout: 10000},
      removeOne: {method:'GET', params:{route: 'removeOne'}, timeout: 10000},
      logout: {method:'GET', params:{route: 'logout'}, timeout: 10000}
    });
  };
  var Insurance = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      path:'ince',
    }, {
      getInfo: {method:'POST', params:{route: 'getInfo'}, timeout: 10000},
      getList: {method:'POST', params:{route: 'getList'}, timeout: abort.promise},
      getDistinct: {method:'POST', params:{route: 'getDistinct'}, timeout: abort.promise},
      modify: {method:'POST', params:{route: 'modify'}, timeout: 10000},
      remove: {method:'POST', params:{route: 'remove'}, timeout: 10000},
      removeOne: {method:'GET', params:{route: 'removeOne'}, timeout: 10000}
    });
  };
  var Consumption = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      path:'cons',
    }, {
      insertOne: {method:'POST', params:{route: 'insertOne'}, timeout: 10000},
      getOne: {method:'POST', params:{route: 'getOne'}, timeout: 10000},
      getList: {method:'POST', params:{route: 'getList'}, timeout: abort.promise},
      updateOne: {method:'POST', params:{route: 'updateOne'}, timeout: 10000}//,
    });
  };
  var Post = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      path:'post',
    }, {
      post: {method:'POST', params:{route:'post'}, timeout: 10000},
      getList: {method:'POST', params:{route: 'getList'}, timeout: abort.promise},
      modify: {method:'POST', params:{route: 'modify'}, timeout: 10000},
      updateOne: {method:'POST', params:{route: 'updateOne'}, timeout: 10000},
      removeOne: {method:'GET', params:{route: 'removeOne'}, timeout: 10000}
    });
  };
  var Resource = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      path:'multer',
    }, {
      rmBrokenFile: {method:'GET', params:{route:'upload'}, timeout: 10000}
    });
  };
  var Interface = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      path:'interface',
    }, {
      captchaImg: {method:'GET', params:{route:'captchaImg'}, timeout: 10000},
      refreshToken: {method:'GET', params:{route:'refreshToken'}, timeout: 10000}
    });
  };
  var outSrc = {
    jiuzhou: $resource(CONFIG.jiuzhou + ':path/:route', {
      path:'cons',
    }, {
      getPaying: {method:'POST', params:{route:'getPaying'}, timeout: 10000}
    })
  };
  self.abort = function ($scope) {
    abort.resolve(); 
    $interval(function () { 
      abort = $q.defer();
      self.User = User(); 
      self.Insurance = Insurance();
      self.Consumption = Consumption();
      self.Post = Post();
      self.Resource = Resource();
      self.Interface = Interface();
      self.outSrc = outSrc;
    }, 0, 1);
  };
  self.User = User();
  self.Insurance = Insurance();
  self.Consumption = Consumption();
  self.Post = Post();
  self.Resource = Resource();
  self.Interface = Interface();
  self.outSrc = outSrc;
  return self;
}])
.factory('User', ['Session', 'Data', 'Token', '$state', '$uibModal', '$q', '$timeout', 'jwtHelper', function (Session, Data, Token, $state, $uibModal, $q, $timeout, jwtHelper) {
  var self = this;
  self.bulkInsert = function (users, options) {
    var deferred = $q.defer();
    Data.User.bulkInsert(users, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };

  self.yljInsert = function (users, options) {
    var deferred = $q.defer();
    Data.User.yljInsert(users, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  
  self.insertOne = function (user, options) {
    var deferred = $q.defer();
    Data.User.insertOne(user, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.login = function ($scope) {
    Data.User.login($scope.login, function (data, status, headers, config, statusText) {
      $scope.error = '';
      Session.set('token', data.results.token);
      Session.set('tokenExt', data.results.tokenExt);
      if ($scope.login.rememberme) {
        Session.set('refreshToken', data.results.refreshToken);
      }
      else {
        Session.rm('refreshToken');
      }
      if (data.results.justActivated) {
        var passwordModal = self.passwordModal($scope);
        passwordModal.result.then(function (user) {
          if ($scope.$close) {
            $scope.$close('登录成功!');
          }
          $timeout(function () { 
            $state.go($scope.state.toStateName || jwtHelper.decodeToken(data.results.token).userRole + '.' + jwtHelper.decodeToken(data.results.token).userRole + 'home');
          }, 0);
        }, function (cancel) {
          if ($scope.$close) {
            $scope.$close('登录成功!');
          }
          $timeout(function () { 
            $state.go($scope.state.toStateName || jwtHelper.decodeToken(data.results.token).userRole + '.' + jwtHelper.decodeToken(data.results.token).userRole + 'home');
          }, 0);
        });
      }
      else {
        if ($scope.$close) {
          $scope.$close('登录成功!');
        }
        $timeout(function () { 
          $state.go($scope.state.toStateName || jwtHelper.decodeToken(data.results.token).userRole + '.' + jwtHelper.decodeToken(data.results.token).userRole + 'home');
        }, 0);
      }
    }, function (err, status, headers, config, statusText) {
      Session.rm('token');
      Session.rm('tokenExt');
      Session.rm('refreshToken');
      Session.rm('fullname');
      Session.rm('gender');
      $scope.error = err.data;
    });
  };
  self.getList = function (query, options, fields) {
    var deferred = $q.defer();
    Data.User.getList(query, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.getInfo = function (token, options, fields) {
    var deferred = $q.defer();
    Data.User.getInfo({token: token}, function (data, headers) { 
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.getOthersInfom = function (query, options) {
    var deferred = $q.defer();
    Data.User.getOthersInfom({query: query, options: options}, function (data, headers) { 
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.modify = function (user, options) {
    var deferred = $q.defer();
    Data.User.modify(user, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.updateOne = function (user, options) {
    var deferred = $q.defer();
    Data.User.updateOne(user, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.updateOnesPwd = function (user, options) {
    var deferred = $q.defer();
    Data.User.updateOnesPwd(user, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.removeOne = function (user, options) {
    var deferred = $q.defer();
    Data.User.removeOne(user, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.logout = function ($scope) {
    var refreshToken = Session.get('refreshToken') && {refreshToken: Session.get('refreshToken')} || {};
    Data.User.logout(refreshToken, function (data, headers) {
      $scope.error = '';
    }, function (err) {
      $scope.error = err.data;
    });
    Session.rm('token');
    Session.rm('tokenExt');
    Session.rm('refreshToken');
    Session.rm('fullname');
    Session.rm('gender');
    if ($scope.isLoggedIn) {
      $scope.isLoggedIn = false;
    }
    else {
      $state.go('anon.login');
    }
  };
  self.loginModal = function ($scope) {
    var modalInstance = $uibModal.open({
      size: '',
      templateUrl: 'partials/modal/login.html',
      controller: 'loginModal',
      backdrop: 'static',
      keyboard: false,
      scope: $scope
    });
    $scope.login = {
      rememberme: true
    };
    return modalInstance;
  };
  self.registerModal = function ($scope, _title, _action, _role) {
    var modalInstance = $uibModal.open({
      size: '',
      templateUrl: 'partials/modal/register.html',
      controller: 'registerModal',
      resolve: {
        title: function () {
          return _title;
        },
        action: function () {
          return _action;
        },
        role: function () {
          return _role;
        }
      },
      scope: $scope
    });
    $scope.register = {
      username: 'i',
      mobile: '13282037883',
      password: 'a',
      repeatPassword: 'a',
      email: 'i@xy.net',
      name: '中国人保',
      gender: 1,
      birthdate: new Date('1983-05-05'),
      idNo: '33018300000000'//,
    };
    return modalInstance;
  };
  self.passwordModal = function ($scope) {
    var modalInstance = $uibModal.open({
      size: '',
      templateUrl: 'partials/modal/password.html',
      controller: 'passwordModal',
      scope: $scope
    });
    return modalInstance;
  };
  self.authorizeModal = function ($scope) {
    var modalInstance = $uibModal.open({
      size: '',
      templateUrl: 'partials/modal/authorize.html',
      controller: 'authorizeModal',
      backdrop: 'static',
      keyboard: false,
      scope: $scope
    });
    return modalInstance;
  };
  return self;
}])
.factory('Insurance', ['Session', 'Data', 'Token', '$state', '$uibModal', '$q', 'jwtHelper', function (Session, Data, Token, $state, $uibModal, $q, jwtHelper) {
  return {
    getInfo: function (query, options, fields) { 
      var deferred = $q.defer();
      Data.Insurance.getInfo({query: query, options: options, fields: fields}, function (data, headers) { 
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },    
    getList: function (query, options, fields) {
      var deferred = $q.defer();
      Data.Insurance.getList(query, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getDistinct: function (field, query) {
      var deferred = $q.defer();
      Data.Insurance.getDistinct({field: field, query: query}, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    modify: function (ince, options) {
      var deferred = $q.defer();
      Data.Insurance.modify(ince, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    remove: function (ince) {
      var deferred = $q.defer();
      Data.Insurance.remove(ince, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    removeOne: function (ince, options) {
      var deferred = $q.defer();
      Data.Insurance.removeOne(ince, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }
  };
}])
.factory('Consumption', ['Storage', 'Data', 'Token', '$state', '$q', 'jwtHelper', function (Storage, Data, Token, $state, $q, jwtHelper) {
  return {
    insertOne: function (cons, options) {
      var deferred = $q.defer();
      Data.Consumption.insertOne(cons, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getOne: function (query, options, fields) {
      var deferred = $q.defer();
      Data.Consumption.getOne({query: query, options: options, fields: fields}, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getList: function (query, options, fields) {
      var deferred = $q.defer();
      Data.Consumption.getList({query: query, options: options, fields: fields}, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    updateOne: function (cons, options) {
      var deferred = $q.defer();
      Data.Consumption.updateOne(cons, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }
  };
}])
.factory('Post', ['Session', 'Data', 'Token', '$state', '$uibModal', '$q', 'jwtHelper', function (Session, Data, Token, $state, $uibModal, $q, jwtHelper) {
  return {
    post: function (post, options) {
      var deferred = $q.defer();
      Data.Post.post(post, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    previewModal: function ($scope) {
      var modalInstance = $uibModal.open({
        size: 'post-preview', 
        templateUrl: 'partials/modal/preview.html',
        controller: 'previewModal',
        scope: $scope
      });
      return modalInstance;
    }
  };
}])
.factory('outSrc', ['Session', 'Data', 'Token', '$state', '$uibModal', '$q', 'jwtHelper', function (Session, Data, Token, $state, $uibModal, $q, jwtHelper) {
  return {
    jiuzhou: {
      getPaying: function (tokenExt) {
        var deferred = $q.defer();
        Data.outSrc.jiuzhou.getPaying({token: tokenExt}, function (data, headers) {
          deferred.resolve(data);
        }, function (err) {
          deferred.reject(err);
        });
        return deferred.promise;
      }
    }
  };
}])
.factory('PageFunc', ['$uibModal', function ($uibModal) {
  return {
    message: function (_msg, _time) {
      var modalInstance = $uibModal.open({
        size: '',
        templateUrl: 'partials/modal/message.html',
        controller: 'messageModal',
        resolve: {
          msg: function () { 
            return _msg; 
          },
          time: function () {
            return _time;
          }
        }
      });
      return modalInstance;
    },
    block: function (_msg) {
      var _time = 'block';
      var modalInstance = $uibModal.open({
        size: '',
        templateUrl: 'partials/modal/message.html',
        controller: 'messageModal',
        backdrop: 'static', 
        keyboard: false, 
        resolve: {
          msg: function () {
            return _msg;
          },
          time: function () {
            return _time;
          }
        }
      });
      return modalInstance; 
    },
    confirm: function (_msg, _title) {
      var modalInstance = $uibModal.open({
        size: 'sm',
        templateUrl: 'partials/modal/confirm.html',
        controller: 'confirmModal',
        resolve: {
          title: function () {
            return _title;
          },
          msg: function () {
            return _msg;
          }
        }
      });
      return modalInstance;  
    },
    prompt: function (_msg, _title) {
      var modalInstance = $uibModal.open({
        size: 'sm',
        templateUrl: 'partials/modal/prompt.html',
        controller: 'promptModal',
        resolve: {
          title: function () {
            return _title;
          },
          msg: function () {
            return _msg;
          }
        }
      });
      return modalInstance;  
    }
  };
}])
.factory('Auth', ['Storage', 'Data', 'Session', '$q', 'ACL', 'Token', function (Storage, Data, Session, $q, ACL, Token) {
  return {
    authorize: function(accessLevel, role) {
        if (role === undefined) {
            role = ACL.userRoles[Token.curUserRole()];
        }
        return accessLevel.bitMask & role.bitMask;
    },
    isLoggedIn: function() {
        return !Token.isExpired();
    }
  };
}])
.factory('TokenInterceptor', ['$q', '$location', 'Session', 'Token', function ($q, $location, Session, Token) {
  return {
  };
}])
.factory('Helpers', [function () {
  return {
    isObjEmpty: function (obj) {
      for (var key in obj) {
          return false;
      }
      return true;
    }
  };
}])
;