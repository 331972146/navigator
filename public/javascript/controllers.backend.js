angular.module('yiyangbao.controllers.backend', [])
.controller('servhome', ['$scope', 'uiGridConstants', '$q', '$interval', 'User', 'Insurance', 'Post', 'PageFunc', 'Data', '$sce', 'Token', function ($scope, uiGridConstants, $q, $interval, User, Insurance, Post, PageFunc, Data, $sce, Token) {
    $scope.stateUrl = 'servhome';
    $scope.incePolicy = {};
    $scope.exportOpts = { 
        rowType: {title: '所有行', value: 'all'},
        colType: {title: '所有列', value: 'all'}
    };
    $scope.importFiles = [];
    
    $scope.serv = {};


    $scope.post = {
        tags: [],
        slides: []
    };
    $scope.posts = {
        list: []
    };
    $scope.temp = {
        uploads: {}, 
        uploaded: {}, 
        fileList: {},
        editFileList: {},
        deferreds: {},
        promises: [],
        files: []
    };
    
    $scope.config = {
        types: [161, 162, 163]
    };
    $scope.$watch('incePolicy.inceNo', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.incePolicy.inceNoIsOk = newVal && newVal.match(/[\d\w]+/);
        }
    });
    $scope.$watch('incePolicy.unit', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.incePolicy.unitIsOk = newVal && newVal._id.match(/[^\s]+/);
        }
    });
    $scope.$watch('incePolicy.branch', function (newVal, oldVal) {
        if (newVal !== oldVal) {
            $scope.incePolicy.branchIsOk = newVal && newVal.match(/[^\s]+/);
        }
    });
    $scope.actions = {
        inceInit: function (isForced) {
            if ($scope.inceQueryData.length === 0 || isForced && $scope.inceQueryIsLoading.length === 0) {
                    inceInit();
            }
        },
        gridResize: function (grid) {
                $interval(function () {
                    $scope[grid].core.handleWindowResize();
                }, 100, 10);
        },
        fileYljSelected: function(files, file, event) {
            if ( files && files.length === 1) {
                var reader = new FileReader();
                var name = files[0].name;
                reader.onload = function(e) {
                    var result = e.target.result;
                    var workbook = XLSX.read(result, {
                        type: 'binary'
                    });
                    var data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                    data.shift();
                    var malData = [];
                    var i, arrLen = data.length;
                    for(i = 0; i < arrLen; i++ ) {
                        if (!data[i].name || data[i].gender > 2 || !data[i].birthdate || !data[i].idType || !data[i].idNo || !data[i].amount) { 
                            malData.push(data[i]);
                        } 

                        if (data[i].amount) {
                            $scope.importGridOptions.columnDefs[8].visible = true;
                        }

                        if (data[i].inceType) {
                            $scope.importGridOptions.columnDefs[9].visible = true;
                        }
                        if (data[i].salary) {
                            $scope.importGridOptions.columnDefs[10].visible = true;
                        }
                        if (data[i].note) {
                            $scope.importGridOptions.columnDefs[11].visible = true;
                        }
                        data[i].birthdate = new Date(data[i].birthdate);
                        data[i].age = parseInt(data[i].age);
                        data[i].amount = parseFloat(data[i].amount);

                        switch (data[i].gender) {
                            case '男':
                                data[i].gender = 1;
                                break;
                            case '女':
                                data[i].gender = 2;
                                break;
                            case '未申明':
                                data[i].gender = 4;
                                break;
                            case '其他':
                                data[i].gender = 5;
                                break;
                            case 'male':
                                data[i].gender = 1;
                                break;
                            case 'female':
                                data[i].gender = 2;
                                break;
                            case 1:
                                data[i].gender = 1;
                                break;
                            case 2:
                                data[i].gender = 2;
                                break;
                            case 3:
                                data[i].gender = 3;
                                break;
                            case 4:
                                data[i].gender = 4;
                                break;
                            case 5:
                                data[i].gender = 5;
                                break;
                            default:
                                data[i].gender = 3;
                        }
                        switch (data[i].inceType) {
                            case '养老金保险':
                                data[i].inceType = 4;
                                break;
                            case '医疗金保险':
                                data[i].inceType = 5;
                                break;
                            default:
                                data[i].inceType = 3;
                        }
                        switch(data[i].detailTitle) {
                            case '分红':
                                data[i].detailType = 4;
                                break;
                            case '支出':
                                data[i].detailType = 3;
                                break;
                            default:
                                data[i].detailType = 1;
                        }
                    }

                    $scope.$apply(function () { 
                        $scope.importYljData = $scope.importYljData.concat(data);
                        $interval(function () { 
                            $scope.importYljGridApi.rowEdit.setRowsDirty(malData); 
                        }, 0, 1);
                        $interval(function () {
                            $scope.importYljGridApi.core.handleWindowResize();
                        }, 100, 10);
                    });
                    

                };

                reader.readAsBinaryString(files[0]);
            }
        },
    	fileSelected: function (files, file, event) {
            if (files && files.length === 1) {
                var reader = new FileReader();
                var name = files[0].name;
                reader.onload = function (e) {
                    var result = e.target.result;
                    var workbook = XLSX.read(result, { 
                        type: 'binary'
                    });
                    var data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                    /* DO SOMETHING WITH workbook HERE */
                    data.shift();
                    var malData = [];
                    var i, arrLen = data.length;
                    for (i = 0; i < arrLen; i++) {
                        if (!data[i].name || data[i].gender > 2 || !data[i].birthdate || !data[i].idType || !data[i].idNo || !data[i].amount) { 
                            malData.push(data[i]);
                        } 
                        if (data[i].bankName) {
                            $scope.importGridOptions.columnDefs[6].visible = true;
                        }
                        if (data[i].accountNo) {
                            $scope.importGridOptions.columnDefs[7].visible = true;
                        }
                        if (data[i].amount) {
                            $scope.importGridOptions.columnDefs[8].visible = true;
                        }
                        if (data[i].inceType) {
                            $scope.importGridOptions.columnDefs[9].visible = true;
                        }
                        if (data[i].salary) {
                            $scope.importGridOptions.columnDefs[10].visible = true;
                        }
                        if (data[i].note) {
                            $scope.importGridOptions.columnDefs[11].visible = true;
                        }
                        data[i].birthdate = new Date(data[i].birthdate);
                        data[i].age = parseInt(data[i].age);
                        data[i].amount = parseInt(data[i].amount);
                        switch (data[i].gender) {
                            case '男':
                                data[i].gender = 1;
                                break;
                            case '女':
                                data[i].gender = 2;
                                break;
                            case '未申明':
                                data[i].gender = 4;
                                break;
                            case '其他':
                                data[i].gender = 5;
                                break;
                            case 'male':
                                data[i].gender = 1;
                                break;
                            case 'female':
                                data[i].gender = 2;
                                break;
                            case 1:
                                data[i].gender = 1;
                                break;
                            case 2:
                                data[i].gender = 2;
                                break;
                            case 3:
                                data[i].gender = 3;
                                break;
                            case 4:
                                data[i].gender = 4;
                                break;
                            case 5:
                                data[i].gender = 5;
                                break;
                            default:
                                data[i].gender = 3;
                        }
                        switch (data[i].inceType) {
                            case '补充医疗保险':
                                data[i].inceType = 1;
                                break;
                            case '高端医疗保险':
                                data[i].inceType = 2;
                                break;
                            default:
                                data[i].inceType = 3;
                        }
                    }         
                    $scope.$apply(function () { 
                        $scope.importData = $scope.importData.concat(data);
                        $interval(function () { 
                            $scope.importGridApi.rowEdit.setRowsDirty(malData); 
                        }, 0, 1);
                        $interval(function () {
                            $scope.importGridApi.core.handleWindowResize();
                        }, 100, 10);
                    });
                };
                reader.readAsBinaryString(files[0]);
	    	}
	    },
        importToggleFiltering: function () {
		    $scope.importGridOptions.enableFiltering = !$scope.importGridOptions.enableFiltering;
		    $scope.importGridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
		},
        inceQueryToggleFiltering: function () {
            $scope.inceQueryGridOptions.enableFiltering = !$scope.inceQueryGridOptions.enableFiltering;
            $scope.inceQueryGridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
        },
		inceExport: function () {
            $scope.inceQueryGridApi.exporter.csvExport($scope.exportOpts.rowType.value, $scope.exportOpts.colType.value);
		},
		iRemoveYljRows: function () {
            var sRows = $scope.importYljGridApi.selection.getSelectedRows();
            $scope.importYljGridApi.selection.clearSelectedRows(event);
            if (sRows.length === $scope.importYljData.length) {
                $scope.importYljData = [];
                $scope.importYljMalUsers = [];
                return;
            }
            var i, arrLen = sRows.length;
            for (i = 0; i < arrLen; i++) {
                var j, arrLen1 = $scope.importYljData.length;
                for (j = 0; j < arrLen1; j++) {
                    if ($scope.importYljData[j].$$hashKey === sRows[i].$$hashKey && $scope.importYljMalUsers[j] && $scope.importYljMalUsers[j].$$hashKey === sRows[i].$$hashKey) {
                        $scope.importYljGridApi.rowEdit.setRowsClean($scope.importYljData.splice(j, 1));
                        $scope.importYljGridApi.rowEdit.setRowsClean($scope.importYljMalUsers.splice(j, 1));
                        break;
                    }
                    if ($scope.importYljData[j].$$hashKey === sRows[i].$$hashKey) {
                        $scope.importYljGridApi.rowEdit.setRowsClean($scope.importYljData.splice(j, 1));
                        break;
                    }
                    if ($scope.importYljMalUsers[j] && $scope.importYljMalUsers[j].$$hashKey === sRows[i].$$hashKey) {
                        $scope.importYljGridApi.rowEdit.setRowsClean($scope.importYljMalUsers.splice(j, 1));
                        break;
                    }
                }
            }
        },
        iRemoveRows: function () {
			var sRows = $scope.importGridApi.selection.getSelectedRows();
            $scope.importGridApi.selection.clearSelectedRows(event);
            if (sRows.length === $scope.importData.length) {
                $scope.importData = [];
                $scope.importMalUsers = [];
                return;
            }
            var i, arrLen = sRows.length;
            for (i = 0; i < arrLen; i++) {
                var j, arrLen1 = $scope.importData.length;
                for (j = 0; j < arrLen1; j++) {
                    if ($scope.importData[j].$$hashKey === sRows[i].$$hashKey && $scope.importMalUsers[j] && $scope.importMalUsers[j].$$hashKey === sRows[i].$$hashKey) {
                        $scope.importGridApi.rowEdit.setRowsClean($scope.importData.splice(j, 1));
                        $scope.importGridApi.rowEdit.setRowsClean($scope.importMalUsers.splice(j, 1));
                        break;
                    }
                    if ($scope.importData[j].$$hashKey === sRows[i].$$hashKey) {
                        $scope.importGridApi.rowEdit.setRowsClean($scope.importData.splice(j, 1));
                        break;
                    }
                    if ($scope.importMalUsers[j] && $scope.importMalUsers[j].$$hashKey === sRows[i].$$hashKey) {
                        $scope.importGridApi.rowEdit.setRowsClean($scope.importMalUsers.splice(j, 1));
                        break;
                    }
                }
            }
		},
        qRemoveInces: function () {
            var confirmModal = PageFunc.confirm('是否删除选中的保单和用户?');
            confirmModal.result.then(function (ok) {
                var sRows = $scope.inceQueryGridApi.selection.getSelectedRows();
                $scope.inceQueryGridApi.selection.clearSelectedRows(event);
                var deletedRows = [];
                var deletedUsers = [];
                var i, arrLen = sRows.length;
                if (arrLen < 100) {
                    for (i = 0; i < arrLen; i++) {
                        Insurance.removeOne({_id: sRows[i]._id}).then(function (data) {
                            deletedRows[deletedRows.length] = data.results._id;
                            if (deletedRows.length === arrLen) {
                                var j;
                                for (j = 0; j < arrLen; j++) {
                                    var k, arrLen1 = $scope.inceQueryData.length;
                                    for (k = 0; k < arrLen1; k++) {
                                        if (deletedRows[j] === $scope.inceQueryData[k]._id) {
                                                $scope.inceQueryData.splice(k, 1);
                                            break;
                                        }
                                    }
                                }
                            }
                        }, function (err) {
                            deletedRows[deletedRows.length] = null;
                            if (deletedRows.length === arrLen) {
                                var j;
                                for (j = 0; j < arrLen; j++) {
                                    var k, arrLen1 = $scope.inceQueryData.length;
                                    for (k = 0; k < arrLen1; k++) {
                                        if (deletedRows[j] === $scope.inceQueryData[k]._id) {
                                                $scope.inceQueryData.splice(k, 1);
                                            break;
                                        }
                                    }
                                }
                            }
                            var m;
                            for (m = 0; m < arrLen; m++) {
                                if (sRows[m]._id === err.config.params._id) {
                                    $scope.inceQueryGridApi.selection.selectRow(sRows[m], event);
                                    break;
                                }
                            }
                            PageFunc.message(err.data, 1000).result.then(null, function (cancel) {
                                $interval(function () {
                                    $scope.inceQueryGridApi.core.handleWindowResize();
                                }, 100, 10);
                            });
                        });
                    }
                }
                else { 
                    for (i = 0; i < arrLen; i++) {
                        deletedRows[deletedRows.length] = {_id: sRows[i]._id}; 
                        deletedUsers[deletedUsers.length] = {'personalInfo.idNo': sRows[i].idNo};
                        var j, arrLen1 = $scope.inceQueryData.length;
                        for (j = 0; j < arrLen1; j++) {
                            if (deletedRows[i]._id === $scope.inceQueryData[j]._id) {
                                    $scope.inceQueryData.splice(j, 1);
                                break;
                            }
                        }
                    }
                    Insurance.remove({inces: deletedRows, users: deletedUsers}).then(function (data) {
                    });
                }
                $interval(function () {
                    $scope.inceQueryGridApi.core.handleWindowResize();
                }, 100, 10);
            }, function (cancel) {
                $interval(function () {
                    $scope.inceQueryGridApi.core.handleWindowResize();
                }, 100, 10);
            });
		},
		addRow: function () {
            if ($scope.importData.length === 0) {
                $scope.importData.unshift({SN: $scope.importData.length + 1});
                $interval(function () { 
                    $scope.importGridApi.rowEdit.setRowsDirty($scope.importData); 
                }, 0, 1);
                $interval(function () {
                    $scope.importGridApi.core.handleWindowResize();
                }, 100, 10);
                return;
            }
			var last = $scope.importData[0];
			if (last.name === undefined || last.gender === undefined || last.birthdate === undefined || last.idType === undefined || last.idNo === undefined || last.amount === undefined) {
				PageFunc.message('请完成新行的填写再增加下一条信息', 1000);
			}
			else {
				$scope.importData.unshift({SN: $scope.importData.length + 1});
                $interval(function () { 
                    $scope.importGridApi.rowEdit.setRowsDirty([$scope.importData[0]]); 
                }, 0, 1);
			}
		},
        setRowsDirty: function () {
            if (!$scope.importMalUsers || !$scope.importMalUsers.length) {
                return;
            }
            $interval(function () { 
                $scope.importGridApi.rowEdit.setRowsDirty($scope.importMalUsers);
            }, 0, 1);
        },
        submitYlj: function() {

            if (!$scope.incePolicy.inceYljNo || !$scope.incePolicy.unitYlj || !$scope.incePolicy.inceYljNo.match(/[\d\w]+/) || !$scope.incePolicy.unitYlj._id.match(/[^\s]+/)) {
                return PageFunc.message('请正确填写保单号及投保单位!', 2000);
            }
            $scope.incePolicy.inceYljNo = $scope.incePolicy.inceYljNo.replace(/[\s]/g, '');
            $scope.incePolicy.branchYlj = $scope.incePolicy.branchYlj && $scope.incePolicy.branchYlj.replace(/[\s]/g, '') || undefined;
            var sRows = $scope.importYljGridApi.selection.getSelectedRows();
            var malSelectedRows = [];
            if ($scope.importYljMalUsers.length !== 0) {
                for (var i in sRows) {
                    for (var j in $scope.importYljMalUsers) {
                        if ($scope.importYljMalUsers[j].$$hashKey === sRows[i].$$hashKey) {
                            malSelectedRows.push(sRows[i]);
                        }
                    }
                }
            }

            if (malSelectedRows.length > 0 || (!sRows.length && $scope.importYljMalUsers.length > 0)) { 
                return PageFunc.message('请补充红色行中缺失的信息!', 2000); 
            }

            var blockModal = PageFunc.block($sce.trustAsHtml('数据写入中...<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>'));

            blockModal.result.then(function (ok) {
                PageFunc.message(ok, 1000).result.then(null, function () {
                    console.log(ok);
                    $interval(function () {
                        $scope.importYljGridApi.core.handleWindowResize();
                    }, 100, 10);
                });
            }, function (cancel) {
                console.log(cancel);
                PageFunc.message(cancel, 1000).result.then(null, function () {
                    $interval(function () {
                        $scope.importYljGridApi.core.handleWindowResize();
                    }, 100, 10);
                });
            });

            if (sRows.length > 0) {
                User.yljInsert({users: sRows, incePolicy: $scope.incePolicy}).then(function (data) {
                    $scope.actions.iRemoveRows(); 
                    blockModal.close('写入成功!');
                }, function (err) {
                        blockModal.dismiss(err.data);
                    console.log(err);
                });
            }
            else {
                User.yljInsert({users: $scope.importYljData, incePolicy: $scope.incePolicy}).then(function (data) {
                    $scope.importYljData = [];
                    $scope.importYljMalUsers = [];
                    $scope.incePolicy = {};
                    $scope.importYljGridApi.selection.clearSelectedRows(event);
                    blockModal.close('写入成功!');
                }, function (err) {
                        blockModal.dismiss(err.data);
                    console.log(err);
                });
            }


        },
        submit: function () {
            if (!$scope.incePolicy.inceNo || !$scope.incePolicy.unit || !$scope.incePolicy.inceNo.match(/[\d\w]+/) || !$scope.incePolicy.unit._id.match(/[^\s]+/)) {
                return PageFunc.message('请正确填写保单号及投保单位!', 2000);
            }
            $scope.incePolicy.inceNo = $scope.incePolicy.inceNo.replace(/[\s]/g, '');
            $scope.incePolicy.branch = $scope.incePolicy.branch && $scope.incePolicy.branch.replace(/[\s]/g, '') || undefined;
            var sRows = $scope.importGridApi.selection.getSelectedRows();
            var malSelectedRows = [];
            if ($scope.importMalUsers.length !== 0) {
                for (var i in sRows) {
                    for (var j in $scope.importMalUsers) {
                        if ($scope.importMalUsers[j].$$hashKey === sRows[i].$$hashKey) {
                            malSelectedRows.push(sRows[i]);
                        }
                    }
                }
            }
            if (malSelectedRows.length > 0 || (!sRows.length && $scope.importMalUsers.length > 0)) { 
                return PageFunc.message('请补充红色行中缺失的信息!', 2000); 
            }
            var blockModal = PageFunc.block($sce.trustAsHtml('数据写入中...<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>'));
            blockModal.result.then(function (ok) {
                PageFunc.message(ok, 1000).result.then(null, function () {
                    console.log(ok);
                    $interval(function () {
                        $scope.importGridApi.core.handleWindowResize();
                    }, 100, 10);
                });
            }, function (cancel) {
                console.log(cancel);
                PageFunc.message(cancel, 1000).result.then(null, function () {
                    $interval(function () {
                        $scope.importGridApi.core.handleWindowResize();
                    }, 100, 10);
                });
            });
            if (sRows.length > 0) {
                User.bulkInsert({users: sRows, incePolicy: $scope.incePolicy}).then(function (data) {
                    $scope.actions.iRemoveRows(); 
                    blockModal.close('写入成功!');
                }, function (err) {
                        blockModal.dismiss(err.data);
                    console.log(err);
                });
            }
            else {
                User.bulkInsert({users: $scope.importData, incePolicy: $scope.incePolicy}).then(function (data) {
                    $scope.importData = [];
                    $scope.importMalUsers = [];
                    $scope.incePolicy = {};
                    $scope.importGridApi.selection.clearSelectedRows(event);
                    blockModal.close('写入成功!');
                }, function (err) {
                        blockModal.dismiss(err.data);
                    console.log(err);
                });
            }
        },
        
        
        userInit: function (isForced) {
            if ($scope.userQueryData.length === 0 || isForced) {
                $interval(function () { 
                    userInit();
                }, 0, 1);
            }
        },
        addNewUser: function () {
            var registerModal = User.registerModal($scope, '新增用户', 'insertOne', 'serv');
            registerModal.result.then(function (user) {
                $scope.userQueryData.unshift(user);
                $interval(function () {
                    $scope.userQueryGridApi.core.handleWindowResize();
                }, 100, 10);
            }, function (cancel) {
                $interval(function () {
                    $scope.userQueryGridApi.core.handleWindowResize();
                }, 100, 10);
            });
        },
        qRemoveUsers: function () {
            var confirmModal = PageFunc.confirm('是否删除选中的用户?');
            confirmModal.result.then(function (ok) {
                var sRows = $scope.userQueryGridApi.selection.getSelectedRows();
                $scope.userQueryGridApi.selection.clearSelectedRows(event);
                var deletedRows = [];
                var i, arrLen = sRows.length;
                if (arrLen < 100) {
                    for (i = 0; i < arrLen; i++) {
                        User.removeOne({_id: sRows[i]._id}).then(function (data) {
                            deletedRows[deletedRows.length] = data.results._id;
                            if (deletedRows.length === arrLen) {
                                var j;
                                for (j = 0; j < arrLen; j++) {
                                    var k, arrLen1 = $scope.userQueryData.length;
                                    for (k = 0; k < arrLen1; k++) {
                                        if (deletedRows[j] === $scope.userQueryData[k]._id) {
                                                $scope.userQueryData.splice(k, 1);
                                            break;
                                        }
                                    }
                                }
                            }
                        }, function (err) {
                            deletedRows[deletedRows.length] = null;
                            if (deletedRows.length === arrLen) {
                                var j;
                                for (j = 0; j < arrLen; j++) {
                                    var k, arrLen1 = $scope.userQueryData.length;
                                    for (k = 0; k < arrLen1; k++) {
                                        if (deletedRows[j] === $scope.userQueryData[k]._id) {
                                                $scope.userQueryData.splice(k, 1);
                                            break;
                                        }
                                    }
                                }
                            }
                            var m;
                            for (m = 0; m < arrLen; m++) {
                                if (sRows[m]._id === err.config.params._id) {
                                    $scope.userQueryGridApi.selection.selectRow(sRows[m], event);
                                    break;
                                }
                            }
                            PageFunc.message(err.data, 1000).result.then(null, function (cancel) {
                                $interval(function () {
                                    $scope.userQueryGridApi.core.handleWindowResize();
                                }, 100, 10);
                            });
                        });
                    }
                }
                else { 
                    for (i = 0; i < arrLen; i++) {
                        deletedRows[deletedRows.length] = {_id: sRows[i]._id}; 
                        var j, arrLen1 = $scope.userQueryData.length;
                        for (j = 0; j < arrLen1; j++) {
                            if (deletedRows[i]._id === $scope.userQueryData[j]._id) {
                                    $scope.userQueryData.splice(j, 1);
                                break;
                            }
                        }
                    }
                    User.remove({users: deletedRows}).then(function (data) {
                    });
                }
                $interval(function () {
                    $scope.userQueryGridApi.core.handleWindowResize();
                }, 100, 10);
            }, function (cancel) {
                $interval(function () {
                    $scope.userQueryGridApi.core.handleWindowResize();
                }, 100, 10);
            });
        },
        getUnitList: function () {
            User.getList({query: 'extInfo.yiyangbaoHealInce.servId'}).then(function (data) {
                $scope.config.unitList = [];
                var i, arrLen = data.results.length;
                for(i = 0; i < arrLen; i++) {
                    $scope.config.unitList[i] = {
                        name: data.results[i].personalInfo.name,
                        _id: data.results[i]._id
                    };
                }
            }, function (err) {
                console.log(err);
            });
        },
        servInit: function (isForced) {
            if (!$scope.serv.list || $scope.serv.list.length === 0 || isForced) {
                $scope.serv.list = [];
                User.getList({query: 'extInfo.yiyangbaoHealInce.authorizedBy.servId'}).then(function (data) {
                    var servlist = data.results;
                    var i, arrLen = servlist.length;
                    for (i = 0; i < arrLen; i++) {
                        var authlist = servlist[i].extInfo.yiyangbaoHealInce.authorizedBy;
                        var j, arrLen1 = authlist.length;
                        for (j = 0; j < arrLen1; j++) {
                            if (authlist[j].servId === Token.userPayload()._id && authlist[j].isRevoked === false) {
                                $scope.serv.list.push({_id: servlist[i]._id, mobile: servlist[i].mobile, personalInfo: servlist[i].personalInfo, extInfo: {yiyangbaoHealInce: {authorizedBy: [authlist[j]]}}});
                            }
                        }
                    }
                }, function (err) {
                    console.log(err);
                });
            }
        },
        authorizeModal: function () {
            var authorizeModal = User.authorizeModal($scope);
            authorizeModal.result.then(function (user) {
                var servlist = $scope.serv.list || [];
                var authlist = user.extInfo.yiyangbaoHealInce.authorizedBy;
                var i, arrLen = authlist.length;
                for (i = 0; i < arrLen; i++) {
                    var j, arrLen1 = servlist.length;
                    for (j = 0; j < arrLen1; j++) {
                        if (authlist[i].servId === Token.userPayload()._id && authlist[i].isRevoked === false && authlist[i].unitId === servlist[j].extInfo.yiyangbaoHealInce.authorizedBy[0].unitId && authlist[i].inceGenNum === servlist[j].extInfo.yiyangbaoHealInce.authorizedBy[0].inceGenNum) {
                            break;
                        }
                    }
                    if (authlist[i].servId === Token.userPayload()._id && authlist[i].isRevoked === false && j === arrLen1) {
                        $scope.serv.list.push({_id: user._id, mobile: user.mobile, personalInfo: user.personalInfo, extInfo: {yiyangbaoHealInce: {authorizedBy: [authlist[i]]}}});
                    }
                }
            }, function (cancel) {
                console.log(cancel);
            });
        },
        authRevoke: function ($index) {
            User.updateOne({query: {_id: $scope.serv.list[$index]._id, 'extInfo.yiyangbaoHealInce.authorizedBy.unitId': $scope.serv.list[$index].extInfo.yiyangbaoHealInce.authorizedBy[0].unitId}, user: {'$set': {'extInfo.yiyangbaoHealInce.authorizedBy.$.isRevoked': true}}}).then(function (data) {
                $scope.serv.list.splice($index, 1);
            }, function (err) {
                console.log(err.data);
            });
        }
    };
        $scope.importData = [];
        $scope.importMalUsers = [];
        $scope.importGridOptions = {
            enableSorting: true,
            enableSelectionBatchEvent: false, 
            showGridFooter: true,
    	    showColumnFooter: true,
            enableGridMenu: true,
            enableCellEditOnFocus: true,
            onRegisterApi: function (gridApi) { 
                $scope.importGridApi = gridApi;
                gridApi.rowEdit.on.saveRow($scope, $scope.checkRow); 
            },
            rowEditWaitInterval: 0,
            data: 'importData' 
        };
        $scope.checkRow = function (rowEntity) {
            var promise = $q.defer();
            $scope.importGridApi.rowEdit.setSavePromise(rowEntity, promise.promise);
                if (rowEntity.name && rowEntity.gender <= 2 && rowEntity.birthdate && rowEntity.idType && rowEntity.idNo && rowEntity.amount) { 
                    $scope.importMalUsers = $scope.importMalUsers.filter(function (row) { 
                        return rowEntity.$$hashKey !== row.$$hashKey; 
                    });
                    promise.resolve();
                } 
                else {
                    var i, arrLen = $scope.importMalUsers.length;
                    var isIn = false;
                    for (i = 0; i < arrLen; i++) {
                        if (rowEntity.$$hashKey === $scope.importMalUsers[i].$$hashKey) {
                            isIn = true;
                            break;
                        }
                    }
                    if (!isIn) {
                        $scope.importMalUsers.push(rowEntity);
                    }
                    promise.reject();
                }
        };
        var importColumnDefs = [ 
            { 
                displayName: '序号',
                field: 'SN',
                type: 'number',
                enableCellEdit: false,      
                enableFiltering: false,
                visible: false
            },
            { 
                displayName: '姓名',
                field: 'name',
                type: 'string',
                width: '7%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    },
                    placeholder: '首字母?'
                }
            },
            { 
                displayName: '性别',
                field: 'gender',
                type: 'string',
                width: '5%',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: '1', label: '男' }, 
                        { value: '2', label: '女' }, 
                        { value: '3', label: '未知'}, 
                        { value: '4', label: '未申明' }, 
                        { value: '5', label: '其他' } 
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'gender', 
                editDropdownOptionsArray: [
                    { id: 1, gender: '男' },
                    { id: 2, gender: '女' }, 
                    { id: 3, gender: '未知'}, 
                    { id: 4, gender: '未申明' }, 
                    { id: 5, gender: '其他' } 
                ],
                cellFilter: 'mapGender' 
            },
            { 
                displayName: '出生日期',
                field: 'birthdate',
                width: '10%',
                filter: {
                    condition: function (term, cellValue) { 
                        switch (term[0]) {
                            case '>':
                                return cellValue > new Date(term.slice(1));
                            case '<':
                                return cellValue < new Date(term.slice(1));
                            default:
                                return cellValue > new Date(term);
                        }
                    },
                    placeholder: '>? <?'
                },
                type: 'date', 
                cellFilter: 'date:"yyyy-MM-dd"'
            },
            {
                displayName: '证件类型',
                field: 'idType',
                type: 'string',
                width: '7%',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: '身份证', label: '身份证' }, 
                        { value: '户口', label: '户口' }, 
                        { value: '驾驶证', label: '驾驶证' }, 
                        { value: '军官证', label: '军官证' }, 
                        { value: '护照', label: '护照' } 
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'type', 
                editDropdownOptionsArray: [
                    { id: '身份证', type: '身份证' },
                    { id: '户口', type: '户口' }, 
                    { id: '驾驶证', type: '驾驶证' }, 
                    { id: '军官证', type: '军官证' }, 
                    { id: '护照', type: '护照' } 
                ]
            },
            { 
                displayName: '证件号码',
                field: 'idNo',
                type: 'string',
                width: '18%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                }
            },
            { 
                displayName: '开户行',
                field: 'bankName',
                type: 'string',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                },
                visible: false
            },
            { 
                displayName: '银行帐号',
                field: 'accountNo',
                type: 'string',
                width: '15%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                }//,
            },
            { 
                displayName: '个人账户资金',
                field: 'amount',
                width: '10%',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.sum, 
                aggregationHideLabel: true//,
            },
            { 
                displayName: '保险类型',
                field: 'inceType',
                type: 'number',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: 1, label: '补充医疗保险' }, 
                        { value: 2, label: '高端医疗保险' }
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'inceType', 
                editDropdownOptionsArray: [
                    { id: 1, inceType: '补充医疗保险' },
                    { id: 2, inceType: '高端医疗保险' }
                ],
                cellFilter: 'mapInceType',
                visible: false
            },
            { 
                displayName: '未满18岁工资证明',
                field: 'salary',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.avg, 
                aggregationHideLabel: true,
                visible: false
            },
            { 
                displayName: '备注',
                field: 'note',
                type: 'string',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                },
                visible: false
            },
            { 
                displayName: '年龄',
                field: 'age',
                width: '6%',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }]
            }
        ];
        $scope.importGridOptions.columnDefs = importColumnDefs;


        $scope.importYljFiles = [];
        $scope.importYljData = [];
        $scope.importYljMalUsers = [];
        $scope.importYljGridOptions = {            
            enableSorting: true,
            enableSelectionBatchEvent: false, 
            showGridFooter: true,
            showColumnFooter: true,
            enableGridMenu: true,
            enableCellEditOnFocus: true,
            onRegisterApi: function (gridApi) { 
                $scope.importYljGridApi = gridApi;
                gridApi.rowEdit.on.saveRow($scope, $scope.checkRow); 
            },
            rowEditWaitInterval: 0,
            data: 'importYljData' 
        }

        var importYljColumnDefs = [
            { 
                displayName: '序号',
                field: 'SN',
                type: 'number',
                enableCellEdit: false,      
                enableFiltering: false,
                visible: false
            },
            { 
                displayName: '姓名',
                field: 'name',
                type: 'string',
                width: '7%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    },
                    placeholder: '首字母?'
                }
            },
            { 
                displayName: '性别',
                field: 'gender',
                type: 'string',
                width: '5%',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: '1', label: '男' }, 
                        { value: '2', label: '女' }, 
                        { value: '3', label: '未知'}, 
                        { value: '4', label: '未申明' }, 
                        { value: '5', label: '其他' } 
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'gender', 
                editDropdownOptionsArray: [
                    { id: 1, gender: '男' },
                    { id: 2, gender: '女' }, 
                    { id: 3, gender: '未知'}, 
                    { id: 4, gender: '未申明' }, 
                    { id: 5, gender: '其他' } 
                ],
                cellFilter: 'mapGender' 
            },
            { 
                displayName: '出生日期',
                field: 'birthdate',
                width: '10%',
                filter: {
                    condition: function (term, cellValue) { 
                        switch (term[0]) {
                            case '>':
                                return cellValue > new Date(term.slice(1));
                            case '<':
                                return cellValue < new Date(term.slice(1));
                            default:
                                return cellValue > new Date(term);
                        }
                    },
                    placeholder: '>? <?'
                },
                type: 'date', 
                cellFilter: 'date:"yyyy-MM-dd"'
            },
            {
                displayName: '证件类型',
                field: 'idType',
                type: 'string',
                width: '7%',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: '身份证', label: '身份证' }, 
                        { value: '户口', label: '户口' }, 
                        { value: '驾驶证', label: '驾驶证' }, 
                        { value: '军官证', label: '军官证' }, 
                        { value: '护照', label: '护照' } 
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'type', 
                editDropdownOptionsArray: [
                    { id: '身份证', type: '身份证' },
                    { id: '户口', type: '户口' }, 
                    { id: '驾驶证', type: '驾驶证' }, 
                    { id: '军官证', type: '军官证' }, 
                    { id: '护照', type: '护照' } 
                ]
            },
            { 
                displayName: '证件号码',
                field: 'idNo',
                type: 'string',
                width: '18%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                }
            },
            { 
                displayName: '保单时间',
                field: 'inceCreateTime',
                width: '10%',
                filter: {
                    condition: function (term, cellValue) { 
                        switch (term[0]) {
                            case '>':
                                return cellValue > new Date(term.slice(1));
                            case '<':
                                return cellValue < new Date(term.slice(1));
                            default:
                                return cellValue > new Date(term);
                        }
                    },
                    placeholder: '>? <?'
                },
                type: 'date', 
                cellFilter: 'date:"yyyy-MM-dd"'
            },
            { 
                displayName: '公司金额',
                field: 'unitAmount',
                width: '10%',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.sum, 
                aggregationHideLabel: true//,
            },
            { 
                displayName: '个人金额',
                field: 'amount',
                width: '10%',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.sum, 
                aggregationHideLabel: true//,
            },
            { 
                displayName: '保险类型',
                field: 'inceType',
                type: 'number',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: 4, label: '养老金保险' }, 
                        { value: 5, label: '医疗金保险' }
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'inceType', 
                editDropdownOptionsArray: [
                    { id: 4, inceType: '养老金保险' },
                    { id: 5, inceType: '医疗金保险' }
                ],
                cellFilter: 'mapInceType',
                visible: true
            },
        ];
        $scope.importYljGridOptions.columnDefs = importYljColumnDefs;




        $scope.inceQueryData = [];
        $scope.inceQueryIsLoading = [];
        $scope.inceQueryGridOptions = {
            enableSorting: true,
            enableCellEdit: false,
            cellEditableCondition: function ($scope) { 
                if ($scope.row.entity.isActivated) {
                    return false;
                }
                return true;
            },
            exporterSuppressColumns: ['_id', 'SN'], 
            exporterLinkLabel: '导出',
            exporterCsvFilename: '用户保单信息.csv',
            exporterMenuPdf: false,
            exporterFieldCallback: function (grid, row, col, input) {
                if (col.name === 'gender') {
                    switch (input) {
                        case 1:
                            return '男';
                        case 2:
                            return '女';
                        default:
                            return '未知';
                    }
                } 
                else if (col.name === 'inceType') {
                    switch (input) {
                        case 1:
                            return '补充医疗保险';
                        case 2:
                            return '高端医疗保险';
                        default:
                            return '其他';
                    }
                }
                else if (col.name === 'isActivated') {
                    switch (input) {
                        case true:
                            return '生效';
                        case false:
                            return '未生效';
                        default:
                            return '未知';
                    }
                }
                else {
                    return input;
                }
            },
            enableSelectionBatchEvent: false, 
            showGridFooter: true,
            showColumnFooter: true,
            enableGridMenu: true,
            enableCellEditOnFocus: true,
            onRegisterApi: function (gridApi) { 
                $scope.inceQueryGridApi = gridApi;
                $interval(function () {
                    gridApi.core.handleWindowResize();
                }, 100, 10);
            },
            rowEditWaitInterval: 2000, 
            data: 'inceQueryData' 
        };
        var inceQueryColumnDefs = [
            { 
                displayName: '序号',
                field: 'SN',
                type: 'number',
                enableCellEdit: false,
                enableFiltering: false,
                visible: false
            },
            { 
                displayName: '姓名',
                field: 'name',
                type: 'string',
                width: '7%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    },
                    placeholder: '首字母?'
                }
            },
            { 
                displayName: '性别',
                field: 'gender',
                type: 'string',
                width: '5%',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: '1', label: '男' }, 
                        { value: '2', label: '女' }, 
                        { value: '3', label: '未知'}, 
                        { value: '4', label: '未申明' }, 
                        { value: '5', label: '其他' } 
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'gender', 
                editDropdownOptionsArray: [
                    { id: 1, gender: '男' },
                    { id: 2, gender: '女' }, 
                    { id: 3, gender: '未知'}, 
                    { id: 4, gender: '未申明' }, 
                    { id: 5, gender: '其他' } 
                ],
                cellFilter: 'mapGender' 
            },
            { 
                displayName: '出生日期',
                field: 'birthdate',
                width: '10%',
                filter: {
                    condition: function (term, cellValue) { 
                        switch (term[0]) {
                            case '>':
                                return cellValue > new Date(term.slice(1));
                            case '<':
                                return cellValue < new Date(term.slice(1));
                            default:
                                return cellValue > new Date(term);
                        }
                    },
                    placeholder: '>? <?'
                },
                type: 'date', 
                cellFilter: 'date:"yyyy-MM-dd"'
            },
            {
                displayName: '证件类型',
                field: 'idType',
                type: 'string',
                width: '7%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    },
                    placeholder: '首字母?'
                }
            },
            { 
                displayName: '证件号码',
                field: 'idNo',
                type: 'string',
                width: '18%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                }
            },
            { 
                displayName: '开户行',
                field: 'bankName',
                type: 'string',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                },
                visible: false
            },
            { 
                displayName: '银行帐号',
                field: 'accountNo',
                type: 'string',
                width: '15%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                }//,
            },
            { 
                displayName: '个人账户资金',
                field: 'amount',
                width: '8%',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.sum, 
                aggregationHideLabel: true,
                visible: true
            },
            { 
                displayName: '个人账户余额',
                field: 'available',
                width: '8%',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.avg, 
                aggregationHideLabel: true,
                visible: false
            },
            { 
                displayName: '已消费金额',
                field: 'consumed',
                width: '8%',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.avg, 
                aggregationHideLabel: true,
                visible: true
            },
            { 
                displayName: '保险类型',
                field: 'inceType',
                type: 'number',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: 1, label: '补充医疗保险' }, 
                        { value: 2, label: '高端医疗保险' }
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'inceType', 
                editDropdownOptionsArray: [
                    { id: 1, inceType: '补充医疗保险' },
                    { id: 2, inceType: '高端医疗保险' }
                ],
                cellFilter: 'mapInceType',
                visible: false
            },
            { 
                displayName: '未满18岁工资证明',
                field: 'salary',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.avg, 
                aggregationHideLabel: true,
                visible: false
            },
            { 
                displayName: '备注',
                field: 'note',
                type: 'string',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                },
                visible: false
            },
            { 
                displayName: '年龄',
                field: 'age',
                width: '6%',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }]//,
            },
            { 
                displayName: 'ID',
                field: '_id',
                type: 'string',
                enableCellEdit: false,
                enableFiltering: false,
                visible: false
            },
            { 
                displayName: '创建时间',
                field: 'version.createTime',
                width: '10%',
                enableCellEdit: false,
                filter: {
                    condition: function (term, cellValue) { 
                        switch (term[0]) {
                            case '>':
                                return cellValue > new Date(term.slice(1));
                            case '<':
                                return cellValue < new Date(term.slice(1));
                            default:
                                return cellValue > new Date(term);
                        }
                    },
                    placeholder: '>? <?'
                },
                type: 'date',
                cellFilter: 'date:"yyyy-MM-dd"'
            },
            { 
                displayName: '到期时间',
                field: 'duration.end',
                width: '10%',
                filter: {
                    condition: function (term, cellValue) { 
                        switch (term[0]) {
                            case '>':
                                return cellValue > new Date(term.slice(1));
                            case '<':
                                return cellValue < new Date(term.slice(1));
                            default:
                                return cellValue > new Date(term);
                        }
                    },
                    placeholder: '>? <?'
                },
                type: 'date',
                cellFilter: 'date:"yyyy-MM-dd"'
            },
            { 
                displayName: '是否生效',
                field: 'isActivated',
                width: '5%',
                enableCellEdit: false,
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: true, label: '是' }, 
                        { value: false, label: '否' }
                    ]
                }, 
                type: 'boolean',
                cellFilter: 'boolean'
            },
            { 
                displayName: '保单号',
                field: 'inceGenNum',
                width: '15%',
                type: 'string'
            },
            { 
                displayName: '投保单位',
                field: 'unit',
                width: '15%',
                type: 'string'
            }
        ];
        $scope.inceQueryGridOptions.columnDefs = inceQueryColumnDefs;
        var inceInit = function () {
            $scope.inceQueryData = [];
            var batch = 1000;
            var firstBatch = 100;
            Insurance.getList().then(function (data) {
                var i = 0, arrLen = Math.ceil((data.results - firstBatch) / batch);
                var reGetList = function (i) {
                    $scope.inceQueryIsLoading.push(i);
                    Insurance.getList({options: {skip: i * batch + firstBatch, limit: batch}}).then(function (data) {
                        var j, arrLen1 = data.results.length;
                        for (j = 0; j < arrLen1; j++) {
                            data.results[j].birthdate = new Date(data.results[j].birthdate);
                            data.results[j].version.createTime = new Date(data.results[j].version.createTime);
                            if (data.results[j].duration) data.results[j].duration.end = new Date(data.results[j].duration.end);
                        }
                        $scope.inceQueryData = $scope.inceQueryData.concat(data.results);
                        $scope.inceQueryIsLoading.pop();
                        i++;
                        if (i < arrLen) {
                            reGetList(i);
                        }
                    }, function (err) {
                        $scope.inceQueryIsLoading.pop();
                        i++;
                        if (i < arrLen) {
                            reGetList(i);
                        }
                        console.log(err);
                    });
                };
                $scope.inceQueryIsLoading.push(0);
                Insurance.getList({options: {limit: firstBatch}}).then(function (data) {
                    var j, arrLen1 = data.results.length;
                    for (j = 0; j < arrLen1; j++) {
                        data.results[j].birthdate = new Date(data.results[j].birthdate);
                        data.results[j].version.createTime = new Date(data.results[j].version.createTime);
                        if (data.results[j].duration) data.results[j].duration.end = new Date(data.results[j].duration.end);
                    }
                    $scope.inceQueryData = $scope.inceQueryData.concat(data.results);
                    $scope.inceQueryIsLoading.pop();
                    reGetList(0);
                }, function (err) {
                    $scope.inceQueryIsLoading.pop();
                    console.log(err);
                    reGetList(0);
                });
            }, function (err) {
                console.log(err);
            });
        };
        $scope.$on('$destroy', function () {
            Data.abort($scope);
        });
        $scope.userQueryData = [];
        $scope.userQueryGridOptions = {
            enableSorting: true,
            cellEditableCondition: function ($scope) { 
                if ($scope.row.entity.accountInfo.isActive) {
                    return false;
                }
                return true;
            },
            enableSelectionBatchEvent: false, 
            showGridFooter: true,
            showColumnFooter: true,
            enableGridMenu: true,
            enableCellEditOnFocus: true,
            onRegisterApi: function (gridApi) { 
                $scope.userQueryGridApi = gridApi;
                gridApi.rowEdit.on.saveRow($scope, $scope.saveRow); 
                $interval(function () {
                    gridApi.core.handleWindowResize();
                }, 100, 10);
            },
            rowEditWaitInterval: 2000, 
            data: 'userQueryData' 
        };
        $scope.saveRow = function (rowEntity) {
            var promise = $q.defer();
            $scope.userQueryGridApi.rowEdit.setSavePromise(rowEntity, promise.promise);
            if (rowEntity.personalInfo.name && rowEntity.mobile && rowEntity.email && rowEntity.personalInfo.idType && rowEntity.personalInfo.idNo && rowEntity.accountInfo.userRole) { 
                var upUser = {
                    _id: rowEntity._id,
                    'personalInfo.name': rowEntity.name,
                    mobile: rowEntity.mobile,
                    email: rowEntity.email,
                    'personalInfo.idType': rowEntity.idType,
                    'personalInfo.idNo': rowEntity.idNo,
                    'accountInfo.userRole': rowEntity.userRole
                };
                User.modify({userObj: upUser}).then(function (data) {
                    console.log(data);
                    if (data.results.count === 0) {
                        promise.reject(data);
                    }
                    else {
                        promise.resolve(data);
                    }
                }, function (err) {
                    console.log(err);
                    promise.reject(err);
                });
            }
            else {
                promise.reject('请完整填写信息');
            }
        };
        var userQueryColumnDefs = [ 
            { 
                displayName: '序号',
                field: 'SN',
                type: 'number',
                enableCellEdit: false,
                enableFiltering: false,
                visible: false
            },
            { 
                displayName: 'ID',
                field: '_id',
                type: 'string',
                enableCellEdit: false,
                enableFiltering: false,
                visible: false
            },
            { 
                displayName: '名称',
                field: 'personalInfo.name',
                type: 'string',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    },
                    placeholder: '首字母?'
                }
            },
            { 
                displayName: '手机号码',
                field: 'mobile',
                type: 'string'
            },
            { 
                displayName: '电子邮箱',
                field: 'email',
                type: 'string'
            },
            { 
                displayName: '证件类型',
                field: 'personalInfo.idType',
                type: 'string',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: '营业执照', label: '营业执照' }, 
                        { value: '机构代码', label: '机构代码' }, 
                        { value: '税务号', label: '税务号' }
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'type', 
                editDropdownOptionsArray: [
                    { id: '营业执照', type: '营业执照' },
                    { id: '机构代码', type: '机构代码' }, 
                    { id: '税务号', type: '税务号' }
                ]
            },
            { 
                displayName: '证件号码',
                field: 'personalInfo.idNo',
                type: 'string'
            },
            { 
                displayName: '是否激活',
                enableCellEdit: false,
                field: 'accountInfo.isActive',
                type: 'boolean',
                visible: false,
                cellFilter: 'boolean'
            },
            { 
                displayName: '用户角色',
                field: 'accountInfo.userRole',
                type: 'string',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [
                        { value: 'unit', label: '投保单位'}//,
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'role', 
                editDropdownOptionsArray: [
                    { id: 'unit', role: '投保单位'}//,
                ],
                cellFilter: 'mapUserRole' 
            },
            { 
                displayName: '域名',
                field: 'extInfo.domain',
                type: 'string',
                enableCellEdit: false,
                cellFilter: 'mapDomain',
                visible: false 
            }
        ];
        $scope.userQueryGridOptions.columnDefs = userQueryColumnDefs;
        var userInit = function () {
            $scope.userQueryData = [];
            User.getList({query: {'accountInfo.userRole': 'unit'}}).then(function (data) {
                $scope.userQueryData = data.results;
            }, function (err) {
                console.log(err);
            });
        };
}])
.controller('incehome', ['$scope', 'uiGridConstants', '$q', '$interval', 'User', 'Insurance', 'Post', 'PageFunc', 'Data', function ($scope, uiGridConstants, $q, $interval, User, Insurance, Post, PageFunc, Data) {
    $scope.stateUrl = 'incehome';
    $scope.exportOpts = { 
        rowType: {title: '所有行', value: 'all'},
        colType: {title: '所有列', value: 'all'}
    };
    $scope.post = {};
    $scope.actions = {
        userInit: function (isForced) {
            if ($scope.userQueryData.length === 0 || isForced) {
                $interval(function () { 
                    userInit();
                }, 0, 1);
            }
        },
        addNewUser: function () {
            var registerModal = User.registerModal($scope, '新增用户', 'insertOne', 'ince');
            registerModal.result.then(function (user) {
                user.SN = $scope.userQueryData.length + 1;
                $scope.userQueryData.unshift(user);
                $interval(function () {
                    $scope.userQueryGridApi.core.handleWindowResize();
                }, 100, 10);
            }, function (cancel) {
                $interval(function () {
                    $scope.userQueryGridApi.core.handleWindowResize();
                }, 100, 10);
            });
        },
        qRemoveUsers: function () {
            var confirmModal = PageFunc.confirm('是否删除选中的用户?');
            confirmModal.result.then(function (ok) {
                var sRows = $scope.userQueryGridApi.selection.getSelectedRows();
                $scope.userQueryGridApi.selection.clearSelectedRows(event);
                var deletedRows = [];
                var i, arrLen = sRows.length;
                if (arrLen < 100) {
                    for (i = 0; i < arrLen; i++) {
                        User.removeOne({_id: sRows[i]._id}).then(function (data) {
                            deletedRows[deletedRows.length] = data.results._id;
                            if (deletedRows.length === arrLen) {
                                var j;
                                for (j = 0; j < arrLen; j++) {
                                    var k, arrLen1 = $scope.userQueryData.length;
                                    for (k = 0; k < arrLen1; k++) {
                                        if (deletedRows[j] === $scope.userQueryData[k]._id) {
                                                $scope.userQueryData.splice(k, 1);
                                            break;
                                        }
                                    }
                                }
                            }
                        }, function (err) {
                            deletedRows[deletedRows.length] = null;
                            if (deletedRows.length === arrLen) {
                                var j;
                                for (j = 0; j < arrLen; j++) {
                                    var k, arrLen1 = $scope.userQueryData.length;
                                    for (k = 0; k < arrLen1; k++) {
                                        if (deletedRows[j] === $scope.userQueryData[k]._id) {
                                                $scope.userQueryData.splice(k, 1);
                                            break;
                                        }
                                    }
                                }
                            }
                            var m;
                            for (m = 0; m < arrLen; m++) {
                                if (sRows[m]._id === err.config.params._id) {
                                    $scope.userQueryGridApi.selection.selectRow(sRows[m], event);
                                    break;
                                }
                            }
                            PageFunc.message(err.data, 1000).result.then(null, function (cancel) {
                                $interval(function () {
                                    $scope.userQueryGridApi.core.handleWindowResize();
                                }, 100, 10);
                            });
                        });
                    }
                }
                else { 
                    for (i = 0; i < arrLen; i++) {
                        deletedRows[deletedRows.length] = {_id: sRows[i]._id}; 
                        var j, arrLen1 = $scope.userQueryData.length;
                        for (j = 0; j < arrLen1; j++) {
                            if (deletedRows[i]._id === $scope.userQueryData[j]._id) {
                                    $scope.userQueryData.splice(j, 1);
                                break;
                            }
                        }
                    }
                    User.remove({users: deletedRows}).then(function (data) {
                    });
                }
                $interval(function () {
                    $scope.userQueryGridApi.core.handleWindowResize();
                }, 100, 10);
            }, function (cancel) {
                $interval(function () {
                    $scope.userQueryGridApi.core.handleWindowResize();
                }, 100, 10);
            });
        },
        postInit: function () {
            $scope.ueConfig = {
                initialFrameHeight: 390,
                autoFloatEnabled: false,
                serverUrl: '/UEditor/upload'
            };
            $scope.ueReady = function (editor) {
            };
        },
        post: function () {
            if (!$scope.post.title || !$scope.post.content) {
                return PageFunc.message('请填写文章标题和内容!', 1000);
            }
            Post.post($scope.post).then(function (data) {
                console.log(data);
            }, function (err) {
                console.log(err);
            });
        },
        inceInit: function (isForced) {
            if ($scope.inceQueryData.length === 0 || isForced && $scope.inceQueryIsLoading.length === 0) {
                inceInit();
            }
        },
        inceToggleFiltering: function () {
            $scope.inceQueryGridOptions.enableFiltering = !$scope.inceQueryGridOptions.enableFiltering;
            $scope.inceQueryGridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
        },
        inceExport: function () {
            $scope.inceQueryGridApi.exporter.csvExport($scope.exportOpts.rowType.value, $scope.exportOpts.colType.value);
        }
    };
        $scope.userQueryData = [];
        $scope.userQueryGridOptions = {
            enableSorting: true,
            enableSelectionBatchEvent: false, 
            showGridFooter: true,
            showColumnFooter: true,
            enableGridMenu: true,
            enableCellEditOnFocus: true,
            onRegisterApi: function (gridApi) { 
                $scope.userQueryGridApi = gridApi;
                gridApi.rowEdit.on.saveRow($scope, $scope.saveRow); 
                $interval(function () {
                    gridApi.core.handleWindowResize();
                }, 100, 10);
            },
            rowEditWaitInterval: 2000, 
            data: 'userQueryData' 
        };
        $scope.saveRow = function (rowEntity) {
            var promise = $q.defer();
            $scope.userQueryGridApi.rowEdit.setSavePromise(rowEntity, promise.promise);
            if (rowEntity.personalInfo.name && rowEntity.personalInfo.gender && rowEntity.mobile && rowEntity.email && rowEntity.personalInfo.idType && rowEntity.personalInfo.idNo && rowEntity.accountInfo.userRole) { 
                var upUser = {
                    _id: rowEntity._id,
                    'personalInfo.name': rowEntity.personalInfo.name,
                    'personalInfo.gender': rowEntity.personalInfo.gender,
                    mobile: rowEntity.mobile,
                    email: rowEntity.email,
                    'personalInfo.idType': rowEntity.personalInfo.idType,
                    'personalInfo.idNo': rowEntity.personalInfo.idNo,
                    'accountInfo.userRole': rowEntity.accountInfo.userRole
                };
                User.modify({userObj: upUser}).then(function (data) {
                    console.log(data);
                    if (data.results.count === 0) {
                        promise.reject(data);
                    }
                    else {
                        promise.resolve(data);
                    }
                }, function (err) {
                    console.log(err);
                    promise.reject(err);
                });
            }
            else {
                promise.reject('请完整填写信息!');
            }
        };
        var userQueryColumnDefs = [ 
            { 
                displayName: '序号',
                field: 'SN',
                type: 'number',
                enableCellEdit: false,
                enableFiltering: false,
                visible: false
            },
            { 
                displayName: 'ID',
                field: '_id',
                type: 'string',
                enableCellEdit: false,
                enableFiltering: false,
                visible: false
            },
            { 
                displayName: '名称',
                field: 'personalInfo.name',
                type: 'string',
                width: '10%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    },
                    placeholder: '首字母?'
                }
            },
            { 
                displayName: '性别',
                field: 'personalInfo.gender',
                type: 'string',
                width: '5%',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: '1', label: '男' }, 
                        { value: '2', label: '女' }, 
                        { value: '3', label: '未知'}, 
                        { value: '4', label: '未申明' }, 
                        { value: '5', label: '其他' } 
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'gender', 
                editDropdownOptionsArray: [
                    { id: 1, gender: '男' },
                    { id: 2, gender: '女' }, 
                    { id: 3, gender: '未知'}, 
                    { id: 4, gender: '未申明' }, 
                    { id: 5, gender: '其他' } 
                ],
                cellFilter: 'mapGender' 
            },
            { 
                displayName: '手机号码',
                width: '12%',
                field: 'mobile',
                type: 'string'
            },
            { 
                displayName: '电子邮箱',
                field: 'email',
                width: '20%',
                type: 'string'
            },
            { 
                displayName: '证件类型',
                field: 'personalInfo.idType',
                width: '7%',
                type: 'string',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: '身份证', label: '身份证' }, 
                        { value: '户口', label: '户口' }, 
                        { value: '驾驶证', label: '驾驶证' }, 
                        { value: '军官证', label: '军官证' }, 
                        { value: '护照', label: '护照' } 
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'type', 
                editDropdownOptionsArray: [
                    { id: '身份证', type: '身份证' },
                    { id: '户口', type: '户口' }, 
                    { id: '驾驶证', type: '驾驶证' }, 
                    { id: '军官证', type: '军官证' }, 
                    { id: '护照', type: '护照' } 
                ]
            },
            { 
                displayName: '证件号码',
                field: 'personalInfo.idNo',
                width: '18%',
                type: 'string'
            },
            { 
                displayName: '是否激活',
                enableCellEdit: false,
                field: 'accountInfo.isActive',
                width: '5%',
                type: 'boolean',
                visible: false ,
                cellFilter: 'boolean'
            },
            { 
                displayName: '用户角色',
                field: 'accountInfo.userRole',
                width: '10%',
                type: 'string',
                enableCellEdit: false,
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [
                        { value: 'serv', label: '服务专员' }//,
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'role', 
                editDropdownOptionsArray: [
                    { id: 'serv', role: '服务专员' }//,
                ],
                cellFilter: 'mapUserRole' 
            },
            { 
                displayName: '域名',
                field: 'extInfo.domain',
                width: '15%',
                type: 'string',
                enableCellEdit: false,
                cellFilter: 'mapDomain',
                visible: false 
            }
        ];
        $scope.userQueryGridOptions.columnDefs = userQueryColumnDefs;
        var userInit = function () {
            $scope.userQueryData = [];
            User.getList({query:{'accountInfo.userRole': 'serv'}}).then(function (data) {
                $scope.userQueryData = data.results;
            }, function (err) {
                console.log(err);
            });
        };
        $scope.inceQueryData = [];
        $scope.inceQueryIsLoading = [];
        $scope.inceQueryGridOptions = {
            enableSorting: true,
            infiniteScrollRowsFromEnd: 40,
            infiniteScrollDown: true,
            exporterSuppressColumns: ['_id', 'SN'], 
            exporterLinkLabel: '导出',
            exporterCsvFilename: '保单信息.csv',
            exporterMenuPdf: false,
            exporterFieldCallback: function (grid, row, col, input) {
                if (col.name === 'gender') {
                    switch (input) {
                        case 1:
                            return '男';
                        case 2:
                            return '女';
                        default:
                            return '未知';
                    }
                } 
                else if (col.name === 'inceType') {
                    switch (input) {
                        case 1:
                            return '补充医疗保险';
                        case 2:
                            return '高端医疗保险';
                        default:
                            return '其他';
                    }
                }
                else if (col.name === 'isActivated') {
                    switch (input) {
                        case true:
                            return '生效';
                        case false:
                            return '未生效';
                        default:
                            return '未知';
                    }
                }
                else {
                    return input;
                }
            },
            enableSelectionBatchEvent: false, 
            showGridFooter: true,
            showColumnFooter: true,
            enableGridMenu: true,
            onRegisterApi: function (gridApi) { 
                $scope.inceQueryGridApi = gridApi;
                gridApi.infiniteScroll.on.needLoadMoreData($scope, $scope.inceGetDataDown);
                $interval(function () {
                    gridApi.core.handleWindowResize();
                }, 100, 10);
            },
            data: 'inceQueryData' 
        };
        var batch = 500;
        var firstBatch = 100;
        $scope.inceGetDataDown = function () {
            var promise = $q.defer();
            $scope.inceQueryIsLoading.push($scope.inceQueryData.length || firstBatch);
            Insurance.getList({options: {skip: $scope.inceQueryData.length || firstBatch, limit: batch}}).then(function (data) {
                var i, arrLen = data.results.length;
                for (i = 0; i < arrLen; i++) {
                    data.results[i].birthdate = new Date(data.results[i].birthdate);
                    data.results[i].version.createTime = new Date(data.results[i].version.createTime);
                    if (data.results[i].duration) data.results[i].duration.end = new Date(data.results[i].duration.end);
                }
                $scope.inceQueryData = $scope.inceQueryData.concat(data.results);
                $scope.inceQueryGridApi.infiniteScroll.dataLoaded(false, data.results.length === batch);
                    promise.resolve();
                $scope.inceQueryIsLoading.pop();
            }, function () {
                $scope.inceQueryGridApi.infiniteScroll.dataLoaded();
                $scope.inceQueryIsLoading.pop();
                promise.reject();
            });
            return promise.promise;
        };
        var inceQueryColumnDefs = [
            { 
                displayName: '序号',
                field: 'SN',
                type: 'number',
                enableCellEdit: false,
                enableFiltering: false,
                visible: false
            },
            { 
                displayName: '姓名',
                field: 'name',
                type: 'string',
                width: '7%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    },
                    placeholder: '首字母?'
                }
            },
            { 
                displayName: '性别',
                field: 'gender',
                type: 'string',
                width: '5%',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: '1', label: '男' }, 
                        { value: '2', label: '女' }, 
                        { value: '3', label: '未知'}, 
                        { value: '4', label: '未申明' }, 
                        { value: '5', label: '其他' } 
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'gender', 
                editDropdownOptionsArray: [
                    { id: 1, gender: '男' },
                    { id: 2, gender: '女' }, 
                    { id: 3, gender: '未知'}, 
                    { id: 4, gender: '未申明' }, 
                    { id: 5, gender: '其他' } 
                ],
                cellFilter: 'mapGender' 
            },
            { 
                displayName: '出生日期',
                field: 'birthdate',
                width: '10%',
                filter: {
                    condition: function (term, cellValue) { 
                        switch (term[0]) {
                            case '>':
                                return cellValue > new Date(term.slice(1));
                            case '<':
                                return cellValue < new Date(term.slice(1));
                            default:
                                return cellValue > new Date(term);
                        }
                    },
                    placeholder: '>? <?'
                },
                type: 'date', 
                cellFilter: 'date:"yyyy-MM-dd"'
            },
            {
                displayName: '证件类型',
                field: 'idType',
                type: 'string',
                width: '7%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    },
                    placeholder: '首字母?'
                }
            },
            { 
                displayName: '证件号码',
                field: 'idNo',
                type: 'string',
                width: '18%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                }
            },
            { 
                displayName: '开户行',
                field: 'bankName',
                type: 'string',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                },
                visible: false
            },
            { 
                displayName: '银行帐号',
                field: 'accountNo',
                type: 'string',
                width: '15%',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                },
                visible: false
            },
            { 
                displayName: '个人账户资金',
                field: 'amount',
                width: '8%',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.sum, 
                aggregationHideLabel: true,
                visible: false
            },
            { 
                displayName: '个人账户余额',
                field: 'available',
                width: '8%',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.avg, 
                aggregationHideLabel: true,
                visible: false
            },
            { 
                displayName: '保险类型',
                field: 'inceType',
                type: 'number',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: 1, label: '补充医疗保险' }, 
                        { value: 2, label: '高端医疗保险' }
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'inceType', 
                editDropdownOptionsArray: [
                    { id: 1, inceType: '补充医疗保险' },
                    { id: 2, inceType: '高端医疗保险' }
                ],
                cellFilter: 'mapInceType',
                visible: false
            },
            { 
                displayName: '未满18岁工资证明',
                field: 'salary',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.avg, 
                aggregationHideLabel: true,
                visible: false
            },
            { 
                displayName: '备注',
                field: 'note',
                type: 'string',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                },
                visible: false
            },
            { 
                displayName: '年龄',
                field: 'age',
                width: '5%',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                visible: false
            },
            { 
                displayName: 'ID',
                field: '_id',
                type: 'string',
                enableCellEdit: false,
                enableFiltering: false,
                visible: false
            },
            { 
                displayName: '创建时间',
                field: 'version.createTime',
                width: '10%',
                enableCellEdit: false,
                filter: {
                    condition: function (term, cellValue) { 
                        switch (term[0]) {
                            case '>':
                                return cellValue > new Date(term.slice(1));
                            case '<':
                                return cellValue < new Date(term.slice(1));
                            default:
                                return cellValue > new Date(term);
                        }
                    },
                    placeholder: '>? <?'
                },
                type: 'date',
                cellFilter: 'date:"yyyy-MM-dd"'
            },
            { 
                displayName: '到期时间',
                field: 'duration.end',
                width: '10%',
                filter: {
                    condition: function (term, cellValue) { 
                        switch (term[0]) {
                            case '>':
                                return cellValue > new Date(term.slice(1));
                            case '<':
                                return cellValue < new Date(term.slice(1));
                            default:
                                return cellValue > new Date(term);
                        }
                    },
                    placeholder: '>? <?'
                },
                type: 'date',
                cellFilter: 'date:"yyyy-MM-dd"'
            },
            { 
                displayName: '是否生效',
                field: 'isActivated',
                width: '5%',
                enableCellEdit: false,
                type: 'boolean',
                cellFilter: 'boolean'
            },
            { 
                displayName: '保单号',
                field: 'inceGenNum',
                width: '15%',
                type: 'string'
            },
            { 
                displayName: '投保单位',
                field: 'unit',
                width: '15%',
                type: 'string'
            }
        ];
        $scope.inceQueryGridOptions.columnDefs = inceQueryColumnDefs;
        var inceInit = function () {
            $scope.inceQueryData = [];
                $scope.inceQueryIsLoading.push(0);
                Insurance.getList({options: {limit: firstBatch}}).then(function (data) {
                    var i, arrLen = data.results.length;
                    for (i = 0; i < arrLen; i++) {
                        data.results[i].birthdate = new Date(data.results[i].birthdate);
                        data.results[i].version.createTime = new Date(data.results[i].version.createTime);
                        if (data.results[i].duration) data.results[i].duration.end = new Date(data.results[i].duration.end);
                    }
                    $scope.inceQueryData = $scope.inceQueryData.concat(data.results);
                    $scope.inceQueryIsLoading.pop();
                }, function (err) {
                    $scope.inceQueryIsLoading.pop();
                    console.log(err);
                });
        };
        $scope.$on('$destroy', function () {
            Data.abort($scope);
        });
}])
.controller('medihome', ['$scope', 'uiGridConstants', '$q', '$interval', 'Session', 'Token', 'User', 'Insurance', 'Consumption', 'Post', 'outSrc', 'PageFunc', 'Data', 'Socket', function ($scope, uiGridConstants, $q, $interval, Session, Token, User, Insurance, Consumption, Post, outSrc, PageFunc, Data, Socket) {
    $scope.stateUrl = 'medihome';
    $scope.post = {};
    $scope.cons = {};
    $scope.error = {};
    var payingPopup, inceInfo;
    $scope.actions = {
        postInit: function () {
            $scope.ueConfig = {
                initialFrameHeight: 390,
                autoFloatEnabled: false,
                serverUrl: '/UEditor/upload'
            };
            $scope.ueReady = function (editor) {
            };
        },
        post: function () {
            if (!$scope.post.title || !$scope.post.content) {
                return PageFunc.message('请填写文章标题和内容!', 1000);
            }
            Post.post($scope.post).then(function (data) {
                $scope.post = {};
                console.log(data);
            }, function (err) {
                console.log(err);
            });
        },
        preview: function () {
            if (!$scope.post.title || !$scope.post.content) {
                return PageFunc.message('请填写文章标题和内容!', 3000);
            }
            Post.previewModal($scope).result.then(function (submit) {
                Post.post($scope.post).then(function (data) {
                    $scope.post = {};
                }, function (err) {
                    console.log(err);
                });
            }, function (cancel) {
                console.log(cancel);
            });
        },
        outConsPaying: function () {
            $scope.state = { 
                toStateName: '.',
                fromStateName: '.'
            };
            $scope.cons.list = [];
            var getPaying = function () {
                var payload = Token.thirdParty();
                outSrc[payload.seniorUnitCode].getPaying(Session.get('tokenExt')).then(function (data) { 
                    Consumption.getOne({seniorUnitCode: payload.seniorUnitCode, unitCode: payload.unitCode, receiptNo: data.results[0].num}).then(function (data1) { 
                        $scope.cons.errMsg = '';
                        $scope.error.checkError = '';
                        if (!data1.results) {
                            $scope.cons.list = data.results;
                            var barcode = data.results[0].yiyang_no;
                            $scope.payBill = {
                                mediId: Token.userPayload()._id,
                                userSocketId: barcode.split(')|(')[0],
                                available: barcode.split(')|(')[1],
                                money: data.results[0].yiyang_amount,
                                outOrgUid: payload.seniorUnitCode,
                                outShopUid: payload.unitCode,
                                outRecptNum: data.results[0].num,
                                items: data.results[0].items,
                                status: {isSubmitted: true}
                            };
                            inceInfo = null;
                            if ($scope.payBill.available === undefined) {
                                barcode = $scope.payBill.userSocketId;
                                Insurance.getInfo({seriesNum: barcode}).then(function (data) {
                                    inceInfo = data.results;
                                    $scope.payBill.available = data.results.ince.available;
                                    $scope.dealPwd = data.results.user.dealPwd;
                                }, function (err) {
                                    $scope.error.checkError = err.data;
                                });
                            }
                        }
                        if ($scope.cons.list.length === 0) {
                            $scope.cons.errMsg = '当前无待支付记录!';
                        }
                    }, function (err) {
                        $scope.error.checkError = err.data; 
                    });
                }, function (err) {
                    console.log(err);
                    $scope.cons.errMsg = err.data;
                    if (err.status === 401) {
                        $scope.cons.errMsg = '请重新登录吧!';
                    }
                });
            };
            if (Token.isExpired()) {
                if (!Session.get('refreshToken')) {
                    User.loginModal($scope).result.then(function (data) {
                        getPaying();
                    }, function (cancel) {
                        console.log(cancel);
                        $scope.cons.errMsg = '请重新登录!';
                    });
                }
                else {
                    Data.Interface.refreshToken(function (data, headers) {
                        getPaying(); 
                    }, function (err) {
                        $scope.cons.errMsg = '请重新登录!';
                    });
                }
            }
            else {
                getPaying();
            }
        },
        consList: function () {
            $scope.cons.list = [];
            Consumption.getList(null, {skip: 0, limit: 10000}).then(function (data) {
                console.log(data.results);
                $scope.cons.errMsg = '';
                $scope.error.checkError = '';
                $scope.cons.list = data.results;
            }, function (err) {
                console.log(err);
                $scope.error.checkError = err.data;
            });
        },
        consRevoked: function () {
            var date = new Date();
            var time = date.getFullYear() + "-" + (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1)) + "-" + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate());
            $scope.cons.consQuery = { 
                status: {isRevoked: true}, 
                time: time
            };
        },
        check: function (index) {
            var payload = Token.thirdParty();
            if (inceInfo) {
                if ($scope.dealPwd === true) {
                    PageFunc.prompt('支付密码', '请输入支付密码').result.then(function (res) {
                        if (res) {
                            var ince = inceInfo.ince;
                            var cons = {
                                userId: inceInfo.user._id,
                                money: $scope.cons.list[index].yiyang_amount,
                                consType: 'medi',
                                outOrgUid: payload.seniorUnitCode,
                                outShopUid: payload.unitCode,
                                outRecptNum: $scope.cons.list[index].num,
                                mediId: $scope.payBill.mediId,
                                items: $scope.cons.list[index].items,
                                status: {isSubmitted: true},
                                seriesNum: ince.seriesNum,
                                incePolicyId: ince._id,
                                unitId: ince.unitId,
                                inceId: ince.inceId,
                                servId: ince.servId,
                                password: res
                            };
                            Consumption.insertOne(cons).then(function (data) {
                                $scope.error.checkError = '用户支付' + data.results.cons.money + '元'; 
                                $scope.cons.errMsg = '';
                                $scope.cons.list = [];
                            }, function (err) {
                                $scope.error.checkError = err.data; 
                            });
                        }
                        else {
                            $scope.error.checkError = '未输入密码!';
                        }
                    }, function (cancel) {
                        $scope.error.checkError = '取消支付!'
                    });
                }
            }
            else {
                Socket.default.emit('pay bill', $scope.payBill, 'check');
                payingPopup = PageFunc.message('用户支付中...');
            }
        }
    };

    $scope.saoma = {};
    $scope.error = {};
    //扫码支付    
    $scope.smActions = {
        getSm: function() {
            var barcode = $scope.saoma.barcode;

            $scope.payBill = {
                mediId: Token.userPayload()._id,
                userSocketId: barcode.split(')|(')[0],
                available: barcode.split(')|(')[1]
            };
            $scope.saoma.barcode = $scope.payBill.userSocketId;

            inceInfo = null;
            if ($scope.payBill.available === undefined) {
                barcode = $scope.payBill.userSocketId;
                Insurance.getInfo({seriesNum: barcode}).then(function (data) {
                    inceInfo = data.results;
                    console.log(inceInfo);
                    $scope.payBill.available = data.results.amountInfo.available;
                    $scope.dealPwd = data.results.user.dealPwd;
                }, function (err) {
                    $scope.error.checkError = err.data;
                });
            }
        },
        check: function() {
            if (inceInfo) {
                if ($scope.dealPwd === true) {
                    PageFunc.prompt('支付密码', '请输入支付密码').result.then(function (res) {
                        if (res) {
                            var ince = inceInfo.ince;
                            var cons = {
                                userId: inceInfo.user._id,
                                money: $scope.payBill.money,
                                consType: 'medi',
                                // outOrgUid: payload.seniorUnitCode,
                                // outShopUid: payload.unitCode,
                                // outRecptNum: $scope.cons.list[index].num,
                                mediId: $scope.payBill.mediId,
                                //items: $scope.cons.list[index].items,
                                status: {isSubmitted: true},
                                seriesNum: ince.seriesNum,
                                incePolicyId: ince._id,
                                unitId: ince.unitId,
                                inceId: ince.inceId,
                                servId: ince.servId,
                                note: $scope.payBill.note,
                                password: res
                            };
                            Consumption.insertOne(cons).then(function (data) {
                                $scope.error.checkError = '用户支付' + data.results.cons.money + '元'; 
                                $scope.payBill = {};
                                $scope.saoma.barcode = '';
                            }, function (err) {
                                $scope.error.checkError = err.data; 
                            });
                        }
                        else {
                            $scope.error.checkError = '未输入密码!';
                        }
                    }, function (cancel) {
                        $scope.error.checkError = '取消支付!'
                    });
                }
            } else {
                Socket.default.emit('pay bill', $scope.payBill, 'check');
                payingPopup = PageFunc.message('用户支付中...');
            }
        }
    };



    Socket.default.on('pay bill', function (data, actions, options, cb) {
        if (actions === 'paid' || actions === 'payError' || actions === 'cancelPay') {
            payingPopup.close(data); 
            $scope.error.checkError = data.msg || '用户取消支付'; 
            
            if (actions === 'paid') {
                $scope.payBill.money = null;
                $scope.payBill.available = undefined;
                $scope.saoma.barcode = '';

                $scope.cons.errMsg = '';
                $scope.cons.list = [];
            }
        }
    });
    $scope.$on('$destroy', function () {
        Socket.getSocket().removeAllListeners();
    });
}])
.controller('unithome', ['$scope', 'uiGridConstants', '$q', '$interval', 'User', 'Insurance', 'PageFunc', 'Data', function ($scope, uiGridConstants, $q, $interval, User, Insurance, PageFunc, Data) {
    $scope.stateUrl = 'unithome';
    $scope.exportOpts = { 
        rowType: {title: '所有行', value: 'all'},
        colType: {title: '所有列', value: 'all'}
    };
    $scope.actions = {
        inceInit: function (isForced) {
            if ($scope.inceQueryData.length === 0 || isForced && $scope.inceQueryIsLoading.length === 0) {
                inceInit();
            }
        },
        toggleFiltering: function () {
            $scope.inceQueryGridOptions.enableFiltering = !$scope.inceQueryGridOptions.enableFiltering;
            $scope.inceQueryGridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
        },
        inceExport: function () {
            $scope.inceQueryGridApi.exporter.csvExport($scope.exportOpts.rowType.value, $scope.exportOpts.colType.value);
        }
    };
        $scope.inceQueryData = [];
        $scope.inceQueryIsLoading = [];
        $scope.inceQueryGridOptions = {
            enableSorting: true,
            cellEditableCondition: function ($scope) { 
                if ($scope.row.entity.isActivated) {
                    return false;
                }
                return true;
            },
            exporterSuppressColumns: ['_id', 'SN'], 
            exporterLinkLabel: '导出',
            exporterCsvFilename: '投保用户信息.csv',
            exporterMenuPdf: false,
            exporterFieldCallback: function (grid, row, col, input) {
                if (col.name === 'gender') {
                    switch (input) {
                        case 1:
                            return '男';
                        case 2:
                            return '女';
                        default:
                            return '未知';
                    }
                } 
                else if (col.name === 'inceType') {
                    switch (input) {
                        case 1:
                            return '补充医疗保险';
                        case 2:
                            return '高端医疗保险';
                        default:
                            return '其他';
                    }
                }
                else if (col.name === 'isActivated') {
                    switch (input) {
                        case true:
                            return '生效';
                        case false:
                            return '未生效';
                        default:
                            return '未知';
                    }
                }
                else {
                    return input;
                }
            },
            enableSelectionBatchEvent: false, 
            showGridFooter: true,
            showColumnFooter: true,
            enableGridMenu: true,
            onRegisterApi: function (gridApi) { 
                $scope.inceQueryGridApi = gridApi;
                $interval(function () {
                    gridApi.core.handleWindowResize();
                }, 100, 10);
            },
            data: 'inceQueryData' 
        };
        var inceQueryColumnDefs = [
            { 
                displayName: '序号',
                field: 'SN',
                type: 'number',
                enableCellEdit: false,
                enableFiltering: false,
                visible: false
            },
            { 
                displayName: '姓名',
                field: 'name',
                type: 'string',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    },
                    placeholder: '首字母?'
                }
            },
            { 
                displayName: '性别',
                field: 'gender',
                type: 'string',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: '1', label: '男' }, 
                        { value: '2', label: '女' }, 
                        { value: '3', label: '未知'}, 
                        { value: '4', label: '未申明' }, 
                        { value: '5', label: '其他' } 
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'gender', 
                editDropdownOptionsArray: [
                    { id: 1, gender: '男' },
                    { id: 2, gender: '女' }, 
                    { id: 3, gender: '未知'}, 
                    { id: 4, gender: '未申明' }, 
                    { id: 5, gender: '其他' } 
                ],
                cellFilter: 'mapGender' 
            },
            { 
                displayName: '出生日期',
                field: 'birthdate',
                filter: {
                    condition: function (term, cellValue) { 
                        switch (term[0]) {
                            case '>':
                                return cellValue > new Date(term.slice(1));
                            case '<':
                                return cellValue < new Date(term.slice(1));
                            default:
                                return cellValue > new Date(term);
                        }
                    },
                    placeholder: '>? <?'
                },
                type: 'date', 
                cellFilter: 'date:"yyyy-MM-dd"'
            },
            {
                displayName: '证件类型',
                field: 'idType',
                type: 'string',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    },
                    placeholder: '首字母?'
                }
            },
            { 
                displayName: '证件号码',
                field: 'idNo',
                type: 'string',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                }
            },
            { 
                displayName: '开户行',
                field: 'bankName',
                type: 'string',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                },
                visible: false
            },
            { 
                displayName: '银行帐号',
                field: 'accountNo',
                type: 'string',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                },
                visible: false
            },
            { 
                displayName: '个人账户资金',
                field: 'amount',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.sum, 
                aggregationHideLabel: true,
                visible: false
            },
            { 
                displayName: '个人账户余额',
                field: 'available',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.avg, 
                aggregationHideLabel: true,
                visible: false
            },
            { 
                displayName: '保险类型',
                field: 'inceType',
                type: 'number',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: 1, label: '补充医疗保险' }, 
                        { value: 2, label: '高端医疗保险' }
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'inceType', 
                editDropdownOptionsArray: [
                    { id: 1, inceType: '补充医疗保险' },
                    { id: 2, inceType: '高端医疗保险' }
                ],
                cellFilter: 'mapInceType',
                visible: false
            },
            { 
                displayName: '未满18岁工资证明',
                field: 'salary',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                aggregationType: uiGridConstants.aggregationTypes.avg, 
                aggregationHideLabel: true,
                visible: false
            },
            { 
                displayName: '备注',
                field: 'note',
                type: 'string',
                filter: {
                    condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    }
                },
                visible: false
            },
            { 
                displayName: '年龄',
                field: 'age',
                type: 'number',
                filters: [{
                    condition: uiGridConstants.filter.GREATER_THAN,
                    placeholder: '大于'
                }, {
                    condition: uiGridConstants.filter.LESS_THAN,
                    placeholder: '小于'
                }],
                visible: false
            },
            { 
                displayName: 'ID',
                field: '_id',
                type: 'string',
                enableCellEdit: false,
                enableFiltering: false,
                visible: false
            },
            { 
                displayName: '创建时间',
                field: 'version.createTime',
                enableCellEdit: false,
                filter: {
                    condition: function (term, cellValue) { 
                        switch (term[0]) {
                            case '>':
                                return cellValue > new Date(term.slice(1));
                            case '<':
                                return cellValue < new Date(term.slice(1));
                            default:
                                return cellValue > new Date(term);
                        }
                    },
                    placeholder: '>? <?'
                },
                type: 'date',
                cellFilter: 'date:"yyyy-MM-dd"'
            },
            { 
                displayName: '到期时间',
                field: 'duration.end',
                filter: {
                    condition: function (term, cellValue) { 
                        switch (term[0]) {
                            case '>':
                                return cellValue > new Date(term.slice(1));
                            case '<':
                                return cellValue < new Date(term.slice(1));
                            default:
                                return cellValue > new Date(term);
                        }
                    },
                    placeholder: '>? <?'
                },
                type: 'date',
                cellFilter: 'date:"yyyy-MM-dd"'
            },
            { 
                displayName: '是否生效',
                field: 'isActivated',
                enableCellEdit: false,
                type: 'boolean',
                cellFilter: 'boolean'
            },
            { 
                displayName: '保单号',
                field: 'inceGenNum',
                type: 'string'
            },
            { 
                displayName: '投保单位',
                field: 'unit',
                type: 'string'
            }
        ];
        $scope.inceQueryGridOptions.columnDefs = inceQueryColumnDefs;
        var inceInit = function () {
            $scope.inceQueryData = [];
            var batch = 1000;
            var firstBatch = 100;
            Insurance.getList().then(function (data) {
                var i = 0, arrLen = Math.ceil((data.results - firstBatch) / batch);
                var reGetList = function (i) {
                    $scope.inceQueryIsLoading.push(i);
                    Insurance.getList({options: {skip: i * batch + firstBatch, limit: batch}}).then(function (data) {
                        var j, arrLen1 = data.results.length;
                        for (j = 0; j < arrLen1; j++) {
                            data.results[j].birthdate = new Date(data.results[j].birthdate);
                            data.results[j].version.createTime = new Date(data.results[j].version.createTime);
                            if (data.results[j].duration) data.results[j].duration.end = new Date(data.results[j].duration.end);
                        }
                        $scope.inceQueryData = $scope.inceQueryData.concat(data.results);
                        $scope.inceQueryIsLoading.pop();
                        i++;
                        if (i < arrLen) {
                            reGetList(i);
                        }
                    }, function (err) {
                        $scope.inceQueryIsLoading.pop();
                        i++;
                        if (i < arrLen) {
                            reGetList(i);
                        }
                        console.log(err);
                    });
                };
                $scope.inceQueryIsLoading.push(0);
                Insurance.getList({options: {limit: firstBatch}}).then(function (data) {
                    var j, arrLen1 = data.results.length;
                    for (j = 0; j < arrLen1; j++) {
                        data.results[j].birthdate = new Date(data.results[j].birthdate);
                        data.results[j].version.createTime = new Date(data.results[j].version.createTime);
                        if (data.results[j].duration) data.results[j].duration.end = new Date(data.results[j].duration.end);
                    }
                    $scope.inceQueryData = $scope.inceQueryData.concat(data.results);
                    $scope.inceQueryIsLoading.pop();
                    reGetList(0);
                }, function (err) {
                    $scope.inceQueryIsLoading.pop();
                    console.log(err);
                    reGetList(0);
                }); 
            }, function (err) {
                console.log(err);
            });
        };
        $scope.$on('$destroy', function () {
            Data.abort($scope);
        });
}])
.controller('admin', ['$scope', 'uiGridConstants', '$q', '$interval', 'User', 'Post', 'PageFunc', 'Data', function ($scope, uiGridConstants, $q, $interval, User, Post, PageFunc, Data) {
    $scope.stateUrl = 'admin';
    $scope.post = {};
    $scope.actions = {
        postInit: function () {
            $scope.ueConfig = {
                initialFrameHeight: 390,
                autoFloatEnabled: false,
                serverUrl: '/UEditor/upload'
            };
        },
        post: function () {
            if (!$scope.post.title || !$scope.post.content) {
                return PageFunc.message('请填写文章标题和内容!', 1000);
            }
            Post.post($scope.post).then(function (data) {
                console.log(data);
            }, function (err) {
                console.log(err);
            });
        },
        userInit: function (isForced) {
            if ($scope.userQueryData.length === 0 || isForced) {
                $interval(function () { 
                    userInit();
                }, 0, 1);
            }
        },
    	addNewUser: function () {
    		var registerModal = User.registerModal($scope, '新增用户', 'insertOne', 'admin');
            registerModal.result.then(function (user) {
                $scope.userQueryData.unshift(user);
                $interval(function () {
                    $scope.userQueryGridApi.core.handleWindowResize();
                }, 100, 10);
            }, function (cancel) {
                $interval(function () {
                    $scope.userQueryGridApi.core.handleWindowResize();
                }, 100, 10);
            });
    	},
    	qRemoveUsers: function () {
    		var confirmModal = PageFunc.confirm('是否删除选中的用户?');
    		confirmModal.result.then(function (ok) {
		      	var sRows = $scope.userQueryGridApi.selection.getSelectedRows();
	            $scope.userQueryGridApi.selection.clearSelectedRows(event);
				var deletedRows = [];
                var i, arrLen = sRows.length;
                if (arrLen < 100) {
                    for (i = 0; i < arrLen; i++) {
                        User.removeOne({_id: sRows[i]._id}).then(function (data) {
                            deletedRows[deletedRows.length] = data.results._id;
                            if (deletedRows.length === arrLen) {
                                var j;
                                for (j = 0; j < arrLen; j++) {
                                    var k, arrLen1 = $scope.userQueryData.length;
                                    for (k = 0; k < arrLen1; k++) {
                                        if (deletedRows[j] === $scope.userQueryData[k]._id) {
                                                $scope.userQueryData.splice(k, 1);
                                            break;
                                        }
                                    }
                                }
                            }
                        }, function (err) {
                            deletedRows[deletedRows.length] = null;
                            if (deletedRows.length === arrLen) {
                                var j;
                                for (j = 0; j < arrLen; j++) {
                                    var k, arrLen1 = $scope.userQueryData.length;
                                    for (k = 0; k < arrLen1; k++) {
                                        if (deletedRows[j] === $scope.userQueryData[k]._id) {
                                                $scope.userQueryData.splice(k, 1);
                                            break;
                                        }
                                    }
                                }
                            }
                            var m;
                            for (m = 0; m < arrLen; m++) {
                                if (sRows[m]._id === err.config.params._id) {
                                    $scope.userQueryGridApi.selection.selectRow(sRows[m], event);
                                    break;
                                }
                            }
                            PageFunc.message(err.data, 1000).result.then(null, function (cancel) {
                                $interval(function () {
                                    $scope.userQueryGridApi.core.handleWindowResize();
                                }, 100, 10);
                            });
                        });
                    }
                }
                else { 
                    for (i = 0; i < arrLen; i++) {
                        deletedRows[deletedRows.length] = {_id: sRows[i]._id}; 
                        var j, arrLen1 = $scope.userQueryData.length;
                        for (j = 0; j < arrLen1; j++) {
                            if (deletedRows[i]._id === $scope.userQueryData[j]._id) {
                                    $scope.userQueryData.splice(j, 1);
                                break;
                            }
                        }
                    }
                    User.remove({users: deletedRows}).then(function (data) {
                    });
                }
                $interval(function () {
                    $scope.userQueryGridApi.core.handleWindowResize();
                }, 100, 10);
		    }, function (cancel) {
                $interval(function () {
                    $scope.userQueryGridApi.core.handleWindowResize();
                }, 100, 10);
		    });
		}
    };
    	$scope.userQueryData = [];
    	$scope.userQueryGridOptions = {
            enableSorting: true,
            cellEditableCondition: function ($scope) { 
                if ($scope.row.entity.accountInfo.isActive) {
                    return false;
                }
                return true;
            },
            enableSelectionBatchEvent: false, 
            showGridFooter: true,
    	    showColumnFooter: true,
            enableGridMenu: true,
            enableCellEditOnFocus: true,
            onRegisterApi: function (gridApi) { 
                $scope.userQueryGridApi = gridApi;
                gridApi.rowEdit.on.saveRow($scope, $scope.saveRow); 
                $interval(function () {
                    gridApi.core.handleWindowResize();
                }, 100, 10);
            },
            rowEditWaitInterval: 2000, 
            data: 'userQueryData' 
        };
        $scope.saveRow = function (rowEntity) {
            var promise = $q.defer();
            $scope.userQueryGridApi.rowEdit.setSavePromise(rowEntity, promise.promise);
            if (rowEntity.personalInfo.name && rowEntity.mobile && rowEntity.email && rowEntity.personalInfo.idType && rowEntity.personalInfo.idNo && rowEntity.accountInfo.userRole) { 
            	var upUser = {
            		_id: rowEntity._id,
                    'personalInfo.name': rowEntity.name,
                    mobile: rowEntity.mobile,
                    email: rowEntity.email,
                    'personalInfo.idType': rowEntity.idType,
                    'personalInfo.idNo': rowEntity.idNo,
            		'accountInfo.userRole': rowEntity.userRole
            	};
                User.modify({userObj: upUser}).then(function (data) {
                	console.log(data);
                	if (data.results.count === 0) {
                        promise.reject(data);
                    }
                    else {
                        promise.resolve(data);
                    }
                }, function (err) {
                	console.log(err);
                	promise.reject(err);
                });
            }
            else {
                promise.reject('请完整填写信息');
            }
        };
        var userQueryColumnDefs = [ 
    		{ 
    			displayName: '序号',
    			field: 'SN',
    			type: 'number',
                enableCellEdit: false,
    			enableFiltering: false,
                visible: false
    		},
    		{ 
    			displayName: 'ID',
    			field: '_id',
                type: 'string',
                enableCellEdit: false,
    			enableFiltering: false,
                visible: false
    		},
            { 
                displayName: '用户名',
                field: 'username',
                type: 'string',
                visible: true
            },
    		{ 
    			displayName: '名称',
    			field: 'personalInfo.name',
                type: 'string',
    			filter: {
    				condition: function (term, cellValue) { 
                        return cellValue && cellValue.match(term);
                    },
    			    placeholder: '首字母?'
    			}
    		},
    		{ 
                displayName: '手机号码',
                field: 'mobile',
                type: 'string'
            },
            { 
                displayName: '电子邮箱',
                field: 'email',
                type: 'string'
            },
            { 
                displayName: '证件类型',
                field: 'personalInfo.idType',
                type: 'string',
                filter: { 
                    type: uiGridConstants.filter.SELECT, 
                    selectOptions: [ 
                        { value: '营业执照', label: '营业执照' }, 
                        { value: '机构代码', label: '机构代码' }, 
                        { value: '税务号', label: '税务号' }
                    ]
                }, 
                editableCellTemplate: 'ui-grid/dropdownEditor',
                editDropdownValueLabel: 'type', 
                editDropdownOptionsArray: [
                    { id: '营业执照', type: '营业执照' },
                    { id: '机构代码', type: '机构代码' }, 
                    { id: '税务号', type: '税务号' }
                ]
            },
            { 
                displayName: '证件号码',
                field: 'personalInfo.idNo',
                type: 'string'
            },
            { 
                displayName: '是否激活',
                enableCellEdit: false,
                field: 'accountInfo.isActive',
                type: 'boolean',
                visible: false,
                cellFilter: 'boolean'
            },
            { 
                displayName: '用户角色',
                field: 'accountInfo.userRole',
                type: 'string',
                filter: { 
    			    type: uiGridConstants.filter.SELECT, 
    			    selectOptions: [
    			    	{ value: 'medi', label: '医药机构' },
    			    	{ value: 'unit', label: '投保单位'},
    			    	{ value: 'ince', label: '保险公司' }
    			    ]
    		  	}, 
    		  	editableCellTemplate: 'ui-grid/dropdownEditor',
    		  	editDropdownValueLabel: 'role', 
    		  	editDropdownOptionsArray: [
    		    	{ id: 'medi', role: '医药机构' },
    		    	{ id: 'unit', role: '投保单位'},
    		    	{ id: 'ince', role: '保险公司' }
        		],
        		cellFilter: 'mapUserRole' 
            },
            { 
                displayName: '域名',
                field: 'extInfo.domain',
                type: 'string',
                enableCellEdit: false,
                cellFilter: 'mapDomain',
                visible: false 
            }
        ];
        $scope.userQueryGridOptions.columnDefs = userQueryColumnDefs;
        var userInit = function () {
            $scope.userQueryData = [];
            User.getList({query:[{'accountInfo.userRole': 'ince'}, {'accountInfo.userRole': 'medi'}, {'accountInfo.userRole': 'unit'}]}).then(function (data) {
                $scope.userQueryData = data.results;
            }, function (err) {
                console.log(err);
            });
        };
}])
;
