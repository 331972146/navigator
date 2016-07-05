var isObjectEmpty = require('../helpers/isObjectEmpty'),
    config = require('../config'),
    multer  = require('multer'),
    jwt = require('jsonwebtoken'),
    util = require('util'),
    fs = require('fs-extra'),
    qt = require('quickthumb'),
    path = require('path'),
    User = require('../models/user'),
    Resource = require('../models/resource');
exports.userResUpload = function (webEntry) {
    return multer({ 
        dest: path.join(__dirname, '../public/upload', webEntry.domain),
        limits: {
            fieldNameSize: config.multerFieldSize || 100,
            fields: config.multerFields || 5,
            fileSize: config.fileSizeLimit || 2048000,
            files: config.multerFiles || 15//,
        },
        putSingleFilesInArray: true,
        rename: function (fieldname, filename, req, res) {
            return filename.replace(/\s+/g, '-').toLowerCase() + '_' + Date.now(); 
        },
        changeDest: function(origDest, req, res) {
            var dest = path.join(origDest, 'userRes', req.user._id);
            fs.ensureDirSync(dest); 
            return dest;
        },
        onFileUploadComplete: function (file, req, res) { 
            var query = { _id: req.user._id },
                queryDel = { _id: req.user._id },
                options = {},
                projection = {};
            var userObj = {};
                userObj[req.body.method] = {};
            var dst = path.join(path.dirname(file.path), 'thumb');
            fs.ensureDirSync(dst);
            qt.convert({
                src: file.path, 
                dst: dst + '/' + file.name,
                width: config.thumbWidth * 2.5
            }, function (err, path) {
                if (err) return console.log(err);
            });
            if (req.body.inArray) {
                if (req.body._id) {
                    userObj[req.body.method][req.body.dest + '.$'] = {
                        _id: req.body._id,
                        title: req.body.queryTitle,
                        uploadTime: new Date(),
                        path: file.path,
                        Url: req.protocol + '://' + webEntry.domainName + '/upload/' + webEntry.domain + '/userRes/' + req.user._id + '/' + file.name
                    };
                    queryDel[req.body.dest + '._id'] = req.body._id; 
                    query[req.body.dest + '._id'] = req.body._id;
                    projection[req.body.dest + '.$'] = 1;
                    options = {select: req.body.dest, new: true};
                }
                else {
                    userObj = {};
                    userObj['$push'] = {};
                    userObj['$push'][req.body.dest] = {
                        title: req.body.queryTitle,
                        uploadTime: new Date(),
                        path: file.path,
                        Url: req.protocol + '://' + webEntry.domainName + '/upload/' + webEntry.domain + '/userRes/' + req.user._id + '/' + file.name
                    };
                    queryDel[req.body.dest + '.path'] = file.path; 
                    options = {select: req.body.dest, new: true};
                }
            }
            else {
                userObj[req.body.method][req.body.dest] = {
                    title: req.body.queryTitle,
                    uploadTime: new Date(),
                    path: file.path,
                    Url: req.protocol + '://' + webEntry.domainName + '/upload/' + webEntry.domain + '/userRes/' + req.user._id + '/' + file.name
                };
                options = {select: req.body.dest, new: true};
            }
            if (req.body.replace) {
                User.getOne(queryDel, function (err, user) {
                    if (err) {
                        return console.log(err);
                    }
                    if (!user) {
                        return console.log('图片不存在!'); 
                    }
                    var pathArray = req.body.dest.split('.');
                    var targetVal = user;
                    for (var i = 0; i < pathArray.length; i++) {
                        targetVal = targetVal[pathArray[i]];
                    }
                    if (targetVal && typeof(targetVal.length) === 'number') {
                        try {
                            var dst = path.join(path.dirname(targetVal[0].path), 'thumb', path.basename(targetVal[0].path));
                            fs.unlink(dst, function (err) {
                                console.log(err);
                            });
                            fs.unlink(targetVal[0].path, function (err) {
                                console.log(err);
                            });
                        }
                        catch (e) {
                            console.log(e);
                        }
                    }
                    else {
                        try {
                            var dst = path.join(path.dirname(targetVal.path), 'thumb', path.basename(targetVal.path));
                            fs.unlink(dst, function (err) {
                                console.log(err);
                            });
                            fs.unlink(targetVal.path, function (err) {
                                console.log(err);
                            });
                        }
                        catch (e) {
                            console.log(11111, e);
                        }
                    }
                }, null, projection);
            }
            User.updateOne(query, userObj, function (err, user) {
                if (err) {
                    return res.status(500).send(err.errmsg);
                }
                if (!user) {
                    return res.status(404).send('图片不存在!'); 
                }
                var pathArray = req.body.dest.split('.');
                var targetVal = user;
                for (var i = 0; i < pathArray.length; i++) {
                    targetVal = targetVal[pathArray[i]];
                }
                res.json({results: targetVal});
            }, options); 
        },
        onError: function (error, next) {
            console.log(error);
            next(error);
        },
        onFileSizeLimit: function (file) { 
            console.log('Failed: ', file.originalname);
            fs.unlink(file.path, function (err) { 
                console.log(err);
            });
        },
        onFilesLimit: function () {
            console.log('Crossed file limit!')
        },
        onFieldsLimit: function () {
            console.log('Crossed fields limit!')
        },
        onPartsLimit: function () {
            console.log('Crossed parts limit!')
        }
    })
};
exports.userResUploaded = function (req, res, next) {
};
exports.receiptUpload = function (webEntry) {
    return multer({ 
        dest: path.join(__dirname, '../public/upload', webEntry.domain),
        limits: {
            fieldNameSize: config.multerFieldSize || 100,
            fields: config.multerFields || 5,
            fileSize: config.fileSizeLimit || 2048000,
            files: config.multerFiles || 15//,
        },
        putSingleFilesInArray: true,
        rename: function (fieldname, filename, req, res) {
            return filename.replace(/\s+/g, '-').toLowerCase() + '_' + Date.now(); 
        },
        changeDest: function(origDest, req, res) {
            var dest = path.join(origDest, 'receiptImg'),
                stat = null;
            fs.ensureDirSync(dest); 
            return dest;
        },
        onFileUploadComplete: function (file, req, res) { 
            var query = {_id: req.body._id}; 
            var consObj = {
                $push: {
                    receiptImg: {
                        title: '',
                        path: file.path,
                        Url: req.protocol + '://' + webEntry.domainName + '/upload/' + webEntry.domain + '/receiptImg/' + file.name
                    }
                }
            };
            req.body.No && (consObj['$push'].receiptImg.No = req.body.No);
            req.body.type && (consObj['$push'].receiptImg.type = req.body.type);
            var dst = path.join(path.dirname(file.path), 'thumb');
            fs.ensureDirSync(dst);
            qt.convert({
                src: file.path, 
                dst: dst + '/' + file.name,
                width: config.thumbWidth * 2.5
            }, function (err, path) {
                if (err) console.log(err);
                qt.convert({
                    src: path, 
                    dst: dst + '/sm_' + file.name,
                    width: config.thumbWidth
                }, function (sm_err, sm_path) {
                    if (sm_err) console.log(sm_err);
                });
                Consumption.updateOne(query, consObj, function (err, cons) {
                    if (err) {
                        return res.status(500).send(err.errmsg);
                    }
                    if (!cons) {
                        return res.status(404).send('消费记录不存在!'); 
                    }
                    res.json({results: cons});
                }, {new: true}); 
            });
        },
        onError: function (error, next) {
            console.log(error);
            next(error);
        },
        onFileSizeLimit: function (file) { 
            console.log('Failed: ', file.originalname);
            fs.unlink(file.path, function (err) { 
                console.log(err);
            });
        },
        onFilesLimit: function () {
            console.log('Crossed file limit!')
        },
        onFieldsLimit: function () {
            console.log('Crossed fields limit!')
        },
        onPartsLimit: function () {
            console.log('Crossed parts limit!')
        }
    })
};
exports.receiptUploaded = function (req, res, next) {
};
exports.multerCommonUpload = function (webEntry) {
    return multer({ 
        dest: path.join(__dirname, '../public/upload', webEntry.domain),
        limits: {
            fieldNameSize: config.multerFieldSize || 100,
            fields: config.multerFields || 5,
            fileSize: config.fileSizeLimit || 2048000,
            files: config.multerFiles || 15//,
        },
        putSingleFilesInArray: true,
        rename: function (fieldname, filename, req, res) {
            return filename.replace(/\s+/g, '-').toLowerCase() + '_' + Date.now(); 
        },
        changeDest: function(origDest, req, res) {
            var dest = path.join(origDest, 'images'),
                stat = null;
            fs.ensureDirSync(dest); 
            return dest;
        },
        onError: function (error, next) {
            console.log(error);
            next(error);
        },
        onFileSizeLimit: function (file) { 
            console.log('Failed: ', file.originalname);
            fs.unlink(file.path, function (err) { 
                console.log(err);
            });
        },
        onFileUploadComplete: function (file, req, res) {             
            var host = req.get('host'),
                domain = host.replace(/^.*?\./, '');

            var resource = new Resource({
                userId: req.user._id,
                url: req.protocol + '://' + host + '/upload/' + host + '/images/' + file.name,
                path: file.path,
                fileName: file.name, 
                md5: req.body.md5,
                resType: file.mimetype, 
                headline: path.basename(file.originalname, path.extname(file.originalname)), 
                fileSize: file.size, 
                extInfo: {
                    host: host,
                    domain: domain
                }
            });

            resource.save(function (err, newRes) {
                // if (err) {
                //     return res.status(500).send(err);
                // }             

                res.json({results: newRes});
            });

        },
        onFilesLimit: function () {
            console.log('Crossed file limit!')
        },
        onFieldsLimit: function () {
            console.log('Crossed fields limit!')
        },
        onPartsLimit: function () {
            console.log('Crossed parts limit!')
        }
    })
};
exports.multerCommonUploaded = function (req, res, next) {
    if (req.method == 'GET') { 
        if (req.query && req.query.name && req.query.size && req.query.type && req.query.lastModified) {
            var fileDir = path.join(__dirname, '../public/upload', req.get('host').replace(/^.*?\./, ''), 'images');
            var filename = path.basename(req.query.name, path.extname(req.query.name)).toLowerCase();
            var extname = path.extname(req.query.name).slice(1).toLowerCase();
            fs.readdir(fileDir, function (error, files) {
                if (error) return res.status(500).send('文件读取失败!');
                files.filter(function (fileName) {
                    var pattern = filename + '_\\d{13}\\.' + extname + '$';
                    var reg = new RegExp(pattern);
                    return reg.test(fileName);
                })
                .forEach(function (file) {
                    try {
                        fs.unlinkSync(path.join(fileDir, file));
                    } 
                    catch (err) {
                        console.log(err);
                    }
                });
                return res.sendStatus(204);
            });
        }
        return next();
    }
    //res.json({files: req.files, body: req.body});
};
exports.ueditorUpload = function(req, res, next, fileInfo) {
    if (req.query.action.search(/upload/) > -1) {
        var date = new Date();
        var type = req.query.action.substring(6);
        var userId = jwt.decode(fileInfo.token, {json: true})._id; 
        var month = date.getFullYear() + "_" + ((date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1));
        var host = req.get('host'),
            domain = host.replace(/^.*?\./, '');
        Resource.getSome({
            md5: fileInfo.md5
        }, function (err, files) {
            if (err) {
                res.json({
                    'state': err.message
                });
                return res.ue_down();
            }
            if (files.length > 0) {
                res.ue_down(); 
                var exist = 0,
                    i = 0,
                    arrLen = files.length;
                for (;i < arrLen; i++) {
                    if (files[i].userId.toString() === userId && files[i].resType === type && files[i].extInfo.domain === domain) {
                        exist++; 
                        break; 
                    }
                }
                if (exist === 0) { 
                    var resource = new Resource({
                        userId: userId,
                        url: files[0].url,  
                        path: files[0].path,
                        fileName: files[0].fileName, 
                        resType: type, 
                        headline: files[0].headline, 
                        md5: fileInfo.md5, 
                        fileSize: fileInfo.size, 
                        extInfo: {
                            host: host,
                            domain: domain
                        }
                    });
                    resource.save(function (err) {
                        if (err) {
                            res.json({
                                'state': err.message
                            });
                        }
                        else {
                            res.json({
                                'url': files[0].url,   
                                'title': files[0].headline,
                                'original': files[0].headline + '.' + files[0].fileName.replace(/^.*\./,''),   
                                'state': 'SUCCESS'
                            });
                        }
                    });
                }
                else { 
                    res.json({
                        'url': files[i].url,   
                        'title': files[i].headline,
                        'original': files[i].headline + '.' + files[i].fileName.replace(/^.*\./,''),   
                        'state': 'SUCCESS'
                    });
                }
            }
            else {
                var resUrl = '/upload/' + type + '/' + userId + '/' + month + '/';
                res.ue_up(resUrl, function (res_url, dest, fileName, headline, origName) {
                    var resource = new Resource({
                            userId: userId,
                            url: req.protocol + '://' + host + res_url,
                            path: dest,
                            fileName: fileName,
                            resType: type, 
                            headline: headline,
                            md5: fileInfo.md5, 
                            fileSize: fileInfo.size, 
                            extInfo: {
                                host: host,
                                domain: domain
                            }
                        });
                    resource.save(function (err) {
                        if (err) {
                            res.json({
                                'state': err.message
                            });
                        }
                        else {
                            res.json({
                                'url': resource.resObj.url,
                                'title': headline,
                                'original': origName,
                                'state': 'SUCCESS'
                            });
                        }
                    });
                }); 
            }
        });
    }
    else if (req.query.action.search(/list/) > -1) {
        var type = req.query.action.substring(4);
        var userId = jwt.decode(req.query.token, {json: true})._id; 
        var host = req.get('host'),
            domain = host.replace(/^.*?\./, '');
        Resource.getSome({
            userId: userId,
            resType: type,
            'extInfo.domain': domain
        }, function (err, files) {
            if (err) {
                res.json({
                    "state": err.message
                });
                return;
            }
            var i = 0;
            var list = [];
            var total = files.length;
            files.forEach(function (file) {
                var filetype = [
                    ".png", ".jpg", ".jpeg", ".gif", ".bmp",
                    ".flv", ".swf", ".mkv", ".avi", ".rm", ".rmvb", ".mpeg", ".mpg",
                    ".ogg", ".ogv", ".mov", ".wmv", ".mp4", ".webm", ".mp3", ".wav", ".mid",
                    ".rar", ".zip", ".tar", ".gz", ".7z", ".bz2", ".cab", ".iso",
                    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".pdf", ".txt", ".md", ".xml"
                ].join();
                var tmplist = file.url.split('.');
                var _filetype = tmplist[tmplist.length - 1];
                if (filetype.indexOf(_filetype.toLowerCase()) >= 0) {
                    var temp = {
                        title: file.headline,
                        original: file.headline + '.' + _filetype,
                        url: file.url
                    };
                    list[i] = (temp);
                } 
                i++;
                if (i === total) {
                    res.json({
                        "state": "SUCCESS",
                        "list": list,
                        "start": 1,
                        "total": total
                    });
                }
            });
        });
    }
    else {
        res.setHeader('Content-Type', 'application/json');
        res.redirect('/ueditor/nodejs/config.json');
    }
};