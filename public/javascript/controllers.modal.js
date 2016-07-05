angular.module('yiyangbao.controllers.modal', [])
.controller('registerModal', ['$scope', '$modalInstance', 'User', '$state', 'Session', 'title', 'action', 'role', function ($scope, $modalInstance, User, $state, Session, title, action, role) {
	$scope.title = title;
	var roleConst = {
		admin: {
      idTypes: ['营业执照', '机构代码', '税务号'],
      userRoles: [{title: '保险公司', value:'ince'},
                  {title: '医药机构', value:'medi'}],
      userGrades: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
    ince: {
      idTypes: ['身份证', '户口', '驾驶证', '军官证', '护照'],
      userRoles: [{title: '服务专员', value:'serv'}]
    },
    serv: {
      idTypes: ['营业执照', '机构代码', '税务号'],
      userRoles: [{title: '投保单位', value:'unit'}]
    }
	};
	$scope.constant = roleConst[role];
  $scope.register.idType = $scope.constant.idTypes[0];
  $scope.register.userRole = $scope.constant.userRoles[0];
	$scope.actions = $scope.actions || {};
	$scope.actions.register = function () { 
		User[action || 'register']($scope.register).then(function (data) {
			$modalInstance.close(data.results);
		}, function (err) {
			$scope.error = err.data;
		});
	};
	$scope.actions.cancel = function (event) {
  	$modalInstance.dismiss('取消');
	};
}])
.controller('loginModal', ['$scope', '$modalInstance', 'User', '$state', 'Session', function ($scope, $modalInstance, User, $state, Session) {
  $scope.actions = $scope.actions || {};
  $scope.actions.login = function () {
		User.login($scope);
	};
	$scope.actions.cancel = function (event) {
  	$modalInstance.dismiss('cancel');
  	Session.rm('token');
    Session.rm('tokenExt');
  	Session.rm('refreshToken');
  	$state.go($scope.state.fromStateName || 'anon.login');
	};
}])
.controller('passwordModal', ['$scope', '$modalInstance', 'User', '$state', 'Session', function ($scope, $modalInstance, User, $state, Session) {
  $scope.actions = $scope.actions || {};
  $scope.actions.password = function () {
    $scope.password.targetKey = 'password';
    console.log($scope.password);
    User.updateOnesPwd($scope.password).then(function (data) {
      $modalInstance.close(data.results);
    }, function (err) {
      $scope.error = err.data;
    });
  };
  $scope.actions.cancel = function (event) {
    $modalInstance.dismiss('取消');
  };
}])
.controller('messageModal', ['$scope', '$modalInstance', '$timeout', 'msg', 'time', function ($scope, $modalInstance, $timeout, msg, time) {
	$scope.msg = msg;
	$scope.actions = $scope.actions || {};
	$scope.actions.cancel = function () {
  	$modalInstance.dismiss('cancel');
	};
	$scope.notBlocked = true;
	if (time === 'block') {
		$scope.notBlocked = false;
		time = null;
	}
	if (time) {
    $timeout(function () {
  		$scope.$dismiss('cancel');
  	}, time);
	}
}])
.controller('confirmModal', ['$scope', '$modalInstance', 'title', 'msg', function ($scope, $modalInstance, title, msg) {
	$scope.title = title;
	$scope.msg = msg;
	$scope.actions = $scope.actions || {};
	$scope.actions.confirm = function () {
		$modalInstance.close('确认删除');
	};
	$scope.actions.cancel = function () {
  	$modalInstance.dismiss('取消删除');
	};
}])
.controller('promptModal', ['$scope', '$modalInstance', 'title', 'msg', function ($scope, $modalInstance, title, msg) {
  $scope.title = title;
  $scope.msg = msg;
  $scope.data = {};
  $scope.actions = $scope.actions || {};
  $scope.actions.submit = function () {
    $modalInstance.close($scope.data.password);
  };
  $scope.actions.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
}])
.controller('previewModal', ['$scope', '$modalInstance', '$sce', 'Session', function ($scope, $modalInstance, $sce, Session) {
  $scope.actions = $scope.actions || {};
  $scope.post.trustCont = $sce.trustAsHtml($scope.post.content);
  $scope.post.time = new Date();
  $scope.post.source = Session.get('fullname');
  $scope.actions.submit = function () {
    $modalInstance.close('确认提交');
  };
  $scope.actions.cancel = function () {
    $modalInstance.dismiss('退出预览');
  };
}])
.controller('authorizeModal', ['$scope', '$modalInstance', 'User', '$state', 'Session', 'Insurance', function ($scope, $modalInstance, User, $state, Session, Insurance) {
  $scope.actions = $scope.actions || {};
  $scope.config = $scope.config || {};
  $scope.auth = $scope.auth || {};
  User.getList({query: 'extInfo.yiyangbaoHealInce.servId'}).then(function (data) {
    $scope.config.errMsg = '';
    $scope.config.unitList = [];
    var i, arrLen = data.results.length;
    for(i = 0; i < arrLen; i++) {
      $scope.config.unitList[i] = {
        name: data.results[i].personalInfo.name,
        _id: data.results[i]._id
      };
    }
  }, function (err) {
    $scope.config.errMsg = err.data;
    console.log(err);
  });
  $scope.actions.cancel = function (event) {
    $modalInstance.dismiss('cancel');
  };
  $scope.actions.getInceList = function (event) {
    Insurance.getDistinct('inceGenNum', {unitId: $scope.auth.unit._id}).then(function (data) {
      $scope.config.errMsg = '';
      $scope.config.inceList = data.results;
      $scope.auth.inceGenNum = $scope.config.inceList[0];
    }, function (err) {
      $scope.config.errMsg = err.data;
      console.log(err);
    });
  };
  $scope.actions.findServ = function (event) {
    if (!$scope.auth.serv) {
      $scope.config.errMsg = '请输入信息!';
      return console.log('请输入信息!');
    }
    var query = {$or: [
        {mobile: $scope.auth.serv, 'accountInfo.userRole': 'serv'},
        {email: $scope.auth.serv, 'accountInfo.userRole': 'serv'},
        {'personalInfo.employeeId': $scope.auth.serv, 'accountInfo.userRole': 'serv'}
    ]};
    User.getOthersInfom(query).then(function (data) {
      $scope.config.errMsg = '';
      $scope.config.servName = data.results.personalInfo.name;
      $scope.auth.authServId = data.results._id;
    }, function (err) {
      $scope.config.errMsg = err.data;
      console.log(err);
    });
  };
  $scope.actions.authorize = function (event) {
    if (!$scope.auth.authServId || !$scope.auth.inceGenNum || !$scope.auth.unit._id || !$scope.auth.unit.name) {
      $scope.config.errMsg = '授权信息不完整!';
      return console.log('授权信息不完整!');
    }
    User.updateOne({query: {_id: $scope.auth.authServId}, user: {'$addToSet': {'extInfo.yiyangbaoHealInce.authorizedBy': {inceGenNum: $scope.auth.inceGenNum, unitName: $scope.auth.unit.name, unitId: $scope.auth.unit._id}}}}).then(function (data) {
      $scope.auth = {};
      $scope.config.errMsg = '';
      $scope.config.servName = '';
      $modalInstance.close(data.results);
    }, function (err) {
      $scope.config.errMsg = err.data;
      console.log(err.data);
    });
  };
}])
;