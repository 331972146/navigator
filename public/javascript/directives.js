angular.module('yiyangbao.directives', [])
.directive("buttonClearInput", function () {
    return {
        restrict: "AE",
        scope: {
            input: "=" 
        },
        template:"<span ng-if='input' class='glyphicon glyphicon-remove form-control-feedback' ng-click='clearInput()'></span>",
        controller: function ($scope, $element, $attrs) {
            $scope.clearInput = function () {
                $scope.input = "";
            };
        }
    };
})
.directive("dynamicHtml", function ($compile) {
    return {
        restrict: 'A',
        replace: true,
        link: function (scope, elem, attr) {
            scope.$watch(attr.dynamicHtml, function (html) {
                elem.html(html);
                $compile(elem.contents())(scope);
            });
        }
    };
})

.directive('postEditor', ['CONFIG', 'Session', 'Post', 'PageFunc', '$q', 'Token', 'Upload', 'md5', function (CONFIG, Session, Post, PageFunc, $q, Token, Upload, md5) {
    return {
        restrict: "AE",
        scope: { 
            post: "=", 
            posts: "=",
            config: "=",
            temp: "=",
            params: "=" 
        },
        templateUrl:"partials/directive/post_editor.html",
        controller: function ($scope, $element, $attrs) {
            $scope.actions = {
                postInit: function () {
                    $scope.ueConfig = {
                        initialFrameHeight: 390,
                        autoFloatEnabled: false,
                        serverUrl: '/UEditor/upload'
                    };
                    if ($scope.post.resources && $scope.post.resources.slides) {
                        var i, arrLen = $scope.post.resources.slides.length;
                        for (i = 0; i < arrLen; i++) {
                            if ($scope.post.resources.selectedImg._id === $scope.post.resources.slides[i]._id) {
                                $scope.post.selectedImg = $scope.post.resources.slides[i];
                            }
                            var fileName = $scope.post.resources.slides[i].fileName.replace(/_\d{13,13}/, '');
                            $scope.temp.editFileList[fileName] = fileName;
                        }
                    }
                },
                post: function () {
                    if (!$scope.post.title || !$scope.post.content) {
                        return PageFunc.message('请填写文章标题和内容!', 3000);
                    }
                    if (!$scope.post.selectedImg) {
                        return PageFunc.message('请选择封面图片!', 3000);
                    }
                    if (!$scope.post.type) {
                        return PageFunc.message('请选择文章类型!', 3000);
                    }
                    if ($scope.post._id) {
                        Post.updateOne($scope.post).then(function (data) {
                            angular.forEach($scope.post, function (value, key) {
                                delete $scope.post[key];
                            });
                            $scope.post.tags = [];
                            $scope.post.slides = [];
                            $scope.temp.files = [];
                            $scope.temp.fileList = {};
                            $scope.temp.editFileList = {};
                            var i, arrLen = $scope.posts.list.length;
                            for (i = 0; i < arrLen; i++) { 
                                if ($scope.posts.list[i]._id === data.results._id) {
                                    $scope.posts.list[i] = data.results;
                                    break;
                                }
                            }
                            $scope.config.tabs[3] = true; 
                        }, function (err) {
                            console.log(err);
                        });
                        return;
                    }
                    Post.post($scope.post).then(function (data) {
                        angular.forEach($scope.post, function (value, key) {
                            delete $scope.post[key];
                        });
                        $scope.post.tags = [];
                        $scope.post.slides = [];
                        $scope.temp.files = [];
                        $scope.temp.fileList = {};
                        $scope.posts.list.unshift(data.results);
                        //$scope.config.tabs[3] = true; 
                    }, function (err) {
                        console.log(err);
                    });
                },
                preview: function () {
                    if (!$scope.post.title || !$scope.post.content) {
                        return PageFunc.message('请填写文章标题和内容!', 3000);
                    }
                    if (!$scope.post.selectedImg) {
                        return PageFunc.message('请选择封面图片!', 3000);
                    }
                    if (!$scope.post.type) {
                        return PageFunc.message('请选择文章类型!', 3000);
                    }
                    Post.previewModal($scope).result.then(function (submit) {
                        if ($scope.post._id) {
                            Post.updateOne($scope.post).then(function (data) {
                                angular.forEach($scope.post, function (value, key) {
                                    delete $scope.post[key];
                                });
                                $scope.post.tags = [];
                                $scope.post.slides = [];
                                $scope.temp.files = [];
                                $scope.temp.fileList = {};
                                $scope.temp.editFileList = {};
                                var i, arrLen = $scope.posts.list.length;
                                for (i = 0; i < arrLen; i++) { 
                                    if ($scope.posts.list[i]._id === data.results._id) {
                                        $scope.posts.list[i] = data.results;
                                        break;
                                    }
                                }
                                $scope.config.tabs[3] = true; 
                            }, function (err) {
                                console.log(err);
                            });
                            return;
                        }
                        Post.addOne($scope.post).then(function (data) {
                            angular.forEach($scope.post, function (value, key) {
                                delete $scope.post[key];
                            });
                            $scope.post.tags = [];
                            $scope.post.slides = [];
                            $scope.temp.files = [];
                            $scope.temp.fileList = {};
                            $scope.posts.list.unshift(data.results);
                            $scope.config.tabs[3] = true; 
                        }, function (err) {
                            console.log(err);
                        });
                    }, function (cancel) {
                        console.log(cancel);
                    });
                },
                clear: function () {
                    angular.forEach($scope.post, function (value, key) {
                        delete $scope.post[key];
                    });
                    $scope.post.tags = [];
                    $scope.post.slides = [];
                    $scope.temp.uploads = {};
                    $scope.temp.uploaded = {};
                    $scope.temp.fileList = {}; 
                    $scope.temp.editFileList = {};
                    $scope.temp.deferreds = {}; 
                    $scope.temp.promises = [];
                    $scope.temp.files = [];
                    delete $scope.temp.tag;
                },
                addTag: function () {
                    var tag = $scope.temp.tag.trim();
                    if (tag && $scope.post.tags.indexOf(tag) === -1) {
                        $scope.post.tags.push($scope.temp.tag.trim());
                    }
                    $scope.temp.tag = '';
                },
                rmTag: function ($index) {
                    $scope.post.tags.splice($index, 1);
                },
                fileSelected: function (files, event) {
                    if (!files) return; 
                    var md5Deferreds = {}; 
                    var md5Promises = [];
                    var fileHash = function (file, index) {
                        md5Deferreds[file.name] = $q.defer(); 
                        md5Promises.push(md5Deferreds[file.name].promise); 
                        var fileReader = new FileReader(); 
                        fileReader.readAsBinaryString(file); 
                        fileReader.onload = function (e) { 
                            file.md5 = md5.createHash(e.target.result); 
                            md5Deferreds[file.name].resolve(); 
                        };
                    };
                    var i, arrLen = files.length;
                    for (i = 0; i < arrLen; i++) {
                        if ($scope.temp.fileList[files[i].name.toLowerCase()] === files[i].name.toLowerCase() || $scope.temp.editFileList[files[i].name.toLowerCase()] === files[i].name.toLowerCase()) { 
                            files.splice(i, 1); 
                            i--; 
                            arrLen--; 
                        }
                        else {
                            $scope.temp.fileList[files[i].name.toLowerCase()] = files[i].name.toLowerCase();
                            fileHash(files[i], i);
                        }
                    }
                    $q.all(md5Promises)
                        .finally(function () { 
                            $scope.temp.files = $scope.temp.files && $scope.temp.files.length && $scope.temp.files.concat(files) || files; 
                        });
                },
                fileDropped: function (files, event, rejFiles) {
                    if (!files) return; 
                    var md5Deferreds = {}; 
                    var md5Promises = [];
                    var fileHash = function (file, index) {
                        md5Deferreds[file.name] = $q.defer(); 
                        md5Promises.push(md5Deferreds[file.name].promise); 
                        var fileReader = new FileReader(); 
                        fileReader.readAsBinaryString(file); 
                        fileReader.onload = function (e) { 
                            var fileMd5 = md5.createHash(e.target.result); 
                            file.md5 = fileMd5; 
                            md5Deferreds[file.name].resolve(fileMd5); 
                        };
                    };
                    var i, arrLen = files.length;
                    for (i = 0; i < arrLen; i++) {
                        if ($scope.temp.fileList[files[i].name.toLowerCase()] === files[i].name.toLowerCase() || $scope.temp.editFileList[files[i].name.toLowerCase()] === files[i].name.toLowerCase()) { 
                            files.splice(i, 1); 
                            i--; 
                            arrLen--; 
                        }
                        else {
                            $scope.temp.fileList[files[i].name.toLowerCase()] = files[i].name.toLowerCase();
                            fileHash(files[i], i);
                        }
                    }
                    $q.all(md5Promises)
                        .then(function (data) {
                        }, function (err) {
                            console.log(err);
                        })
                        .finally(function () { 
                            $scope.temp.files = $scope.temp.files && $scope.temp.files.length && $scope.temp.files.concat(files) || files; 
                        });
                    $scope.rejFiles = rejFiles;
                },
                clearFiles: function () {
                    $scope.temp.files = [];
                    $scope.temp.uploads = {};
                    $scope.temp.uploaded = {};
                    $scope.temp.fileList = {}; 
                    $scope.temp.deferreds = {}; 
                    $scope.temp.promises = []; 
                },
                rmImg: function ($index) {
                    delete $scope.temp.fileList[$scope.temp.files[$index].name]; 
                    delete $scope.temp.uploads[$scope.temp.files[$index].name];
                    delete $scope.temp.uploaded[$scope.temp.files[$index].name];
                    delete $scope.temp.deferreds[$scope.temp.files[$index].name]; 
                    $scope.temp.files.splice($index, 1);
                },
                uploadFiles: function () {
                    if ($scope.temp.files && $scope.temp.files.length) {
                        
                        for (var i = 0; i < $scope.temp.files.length; i++) {
                            var file = $scope.temp.files[i];
                            $scope.temp.deferreds[file.name] = $q.defer();
                            $scope.temp.promises[i] = $scope.temp.deferreds[file.name].promise;
                            if (file.uploaded || file.exceeded || $scope.temp.uploaded[file.name]) { 
                                if ($scope.temp.uploaded[file.name]) {
                                    file.uploaded = $scope.temp.uploaded[file.name].uploaded;
                                    file.exceeded = $scope.temp.uploaded[file.name].exceeded;
                                }
                                $scope.temp.deferreds[file.name].resolve();
                                continue; 
                            }
                            $scope.temp.uploaded[file.name] = file; 

                            $scope.temp.uploads[file.name] = Upload.upload({
                                url: CONFIG.baseUrl + CONFIG.resUploadPath 
                                , file: file
                                , method: 'POST'
                                , headers: {
                                    'Authorization': 'Bearer ' + Session.get('token'),
                                    'router-action': 'addSome'
                                } 
                                , fields: {'md5': file.md5} 
                            }).progress(function (evt) {
                                var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                            }).success(function (data, status, headers, config) {
                                
                                    $scope.post.slides.push(data.results);
                                    $scope.temp.uploaded[config.file.name].uploaded = true; 
                                    $scope.temp.uploaded[config.file.name].fileObj = data.results; 
                                    $scope.temp.deferreds[config.file.name].resolve();
                            }).error(function (err, status, headers, config) {
                                $scope.temp.uploaded[config.file.name].exceeded = true;
                                $scope.temp.deferreds[config.file.name].reject();
                            });
                        }
                        $q.all($scope.temp.promises).finally(function () {
                            console.log('All Done!');
                        });
                    }
                },
                customFilter: function (bottom, top) {
                    return function (v, i, arr) {
                        return v >= bottom && v <= top;
                    }
                }
            };
            $scope.actions.postInit();
        }
    };
}])

.directive("scriptEmbedded", ['$window', function ($window) {
    return {
        restrict: "AE",
        scope: false,
        link: function (scope, elem, attr) {
            var s = $window.document.createElement("script");
            s.type = "text/javascript";                
            var src = elem.attr('src');
            if(src!==undefined) {
                s.src = src;
            }
            else {
                var code = elem.text();
                elem[0].innerText = '';
                s.text = code;
            }
            elem[0].appendChild(s);
        }
    };
}]);