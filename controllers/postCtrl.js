var config = require('../config'),
    crypto = require('crypto'),
    User = require('../models/user'),
    Post = require('../models/post'),
    Comment = require('../models/comment'),
    Resource = require('../models/resource');
exports.onArticles = function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1,
        requestNo = req.query.requestNO ? parseInt(req.query.requestNO) : 0,
        host = req.get('host'),
        domain = host.replace(/^.*?\./, ''),
        type = req.params.type;
    requestNo = requestNo || config.articlePerPage;
    Post.getSome({
        type: type, 
        status: {$gte: config.postAdvisor}, 
        'extInfo.domain': domain
    }, page, requestNo, function (err, posts, total) {
        if (err) {
            posts = [];
            req.flash('error', err.message);
        }
        res.render('articles', {
            title: config.postTypes[type].title,
            user: req.session.user,
            posts: posts,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * config.articlePerPage + posts.length) == total,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
};
exports.onArticle = function (req, res, next) {
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    Post.getOne({
        username: req.params.username, 
        "time.second": req.params.second, 
        title: req.params.title,
        'extInfo.domain': domain
    }, function (err, post) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/');
        }
        if (post) {
            var comments = [];
            post.comments.forEach(function (comment) {
                if (comment.status >= config.commentAdvisor) {
                    comments.push(comment);
                }
            });
            post.comments = comments;
            var defaultAct = function () {
                res.render('article', {
                    title: req.params.title,
                    post: post,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            };
            switch (post.type) {
                case 0:
                    if (post.action === 'default') {
                        defaultAct();
                    }
                    else {
                        defaultAct();
                    }
                    break;
                case 1:
                    if (post.action === 'default') {
                        defaultAct();
                    }
                    else {
                    }
                    break;
                case 2:
                    if (post.action === 'default') {
                        defaultAct();
                    }
                    else {
                    }
                    break;
                default:
                    if (post.action === 'default') {
                        defaultAct();
                    }
                    else {
                        defaultAct();
                    }
                    break;
            }
        }
        else {
            next();
        }        
    });
};
exports.post = function (req, res) {
    var img_res = req.body.content.match(/src="http:\/\/.*?"/gim),
        file_res = req.body.content.match(/href="http:\/\/.*?"/gim),
        imgRes = [],
        fileRes = [];
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    img_res && img_res.forEach(function (i_res) {
        if (imgRes.indexOf(i_res) < 0) {
            var img = i_res.replace(/src="(http:\/\/.*?)"/gim, "$1");
            imgRes.push(img);
        }
    });

    file_res && file_res.forEach(function (f_res) {
        if (fileRes.indexOf(f_res) < 0) {
            var file = f_res.replace(/href="(http:\/\/.*?)"/gim, "$1");
            fileRes.push(file);
        }
    });
    var selectedImg = req.body.selectedImg;
    
    var curUser = req.user;
    var post = new Post({
            userId: curUser._id,
            userRole: curUser.userRole,
            head: curUser.head,
            title: req.body.title.trim(),
            post: req.body.content,
            type: req.body.type,
            extInfo: {
                host: host,
                domain: domain
            },
            resources: {
                img: imgRes,
                file: fileRes,
                selectedImg: selectedImg
            }
        });
    post.save(function (err, post) {
        if (err) {
            return res.status(500).send(err.errmsg);
        }
        res.json({results: post});
    });
};
exports.comment = function (req, res) {
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    if (!req.body.content) {
        req.flash('error', '评论不能为空!'); 
        return res.redirect('back');
    }
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
               date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48"; 
    var query = {
        username: req.params.username, 
        'time.second': req.params.second, 
        title: req.params.title,
        'extInfo.domain': domain
    };
    var comment = {
        username: req.body.username,
        head: head,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };
    var newComment = new Comment(query, comment);
    newComment.save(function (err) {
        if (err) {
            req.flash('error', err.message); 
            return res.redirect('back');
        }
        req.flash('success', '留言成功!');
        res.redirect('back');
    });
};
exports.onEdit = function (req, res, next) {
    var currentUser = req.session.user;
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    Post.edit({
        username: currentUser.username, 
        "time.second": req.params.second, 
        title: req.params.title,
        'extInfo.domain': domain
    }, function (err, post) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        if (post) {
            var selected = {};
            selected[post.type] = 'selected="selected"'; 
            res.render('edit', {
                title: '编辑',
                post: post,
                types: config.postTypes,
                selected: selected,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        }
        else {
            next();
        }
    });
};
exports.edit = function (req, res) {
    var img_res = req.body.post.match(/src="\/upload\/.*?"/gim),
        file_res = req.body.post.match(/href="\/upload\/.*?"/gim),
        imgRes = [],
        fileRes = [];
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    img_res && img_res.forEach(function (img) {
        if (imgRes.indexOf(img) < 0) {
            imgRes.push(img);
        }
    });
    file_res && file_res.forEach(function (file) {
        if (fileRes.indexOf(file) < 0) {
            fileRes.push(file);
        }
    });
    var tags = [req.body.tag1 || '', req.body.tag2 || '', req.body.tag3 || ''];
    var currentUser = req.session.user;
    var obj = {
        post: req.body.post,
        tags: tags,
        type: req.body.type,
        action: req.body.action ? req.body.action : 'default',
        resources: {
            img: imgRes,
            file: fileRes
        }
    };
    Post.update({
        username: currentUser.username, 
        "time.second": req.params.second, 
        title: req.params.title,
        'extInfo.domain': domain
    }, obj, function (err) {
        var url = encodeURI('/u/' + req.params.username + '/' + req.params.second + '/' + req.params.title + '/' + obj.action);
        if (err) {
            req.flash('error', err.message);
            return res.redirect(url);
        }
        req.flash('success', '修改成功!');
        res.redirect(url);
    });
};
exports.onReprint = function (req, res, next) {
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    Post.edit({
        username: req.params.username, 
        "time.second": req.params.second, 
        title: req.params.title,
        'extInfo.domain': domain
    }, function (err, post) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect(back);
        }
        if (post) {
            var currentUser = req.session.user,
                reprint_from = {username: post.username, second: post.time.second, title: post.title, domain: post.extInfo.domain},
                action = post.action ? post.action : 'default',
                reprint_to = {username: currentUser.username, head: currentUser.head, action: action, domain: domain};
            Post.reprint(reprint_from, reprint_to, function (err, post) {
                if (err) {
                    req.flash('error', err.message); 
                    return res.redirect('back');
                }
                if (post) {
                    req.flash('success', '转载成功!');
                    var url = encodeURI('/u/' + post.username + '/' + post.time.second + '/' + post.title + '/' + post.action);
                    res.redirect(url);
                }
                else {
                    next();
                }
            });
        }
        else {
            next();
        }
    });
};
exports.onArchive = function (req, res) {
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    Post.getArchive({
        'extInfo.domain': domain
    }, function (err, posts) {
        if (err) {
            req.flash('error', err.message); 
            return res.redirect('/');
        }
        res.render('archive', {
            title: '存档',
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
};
exports.onTags = function (req, res) {
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    Post.getTags({
        'extInfo.domain': domain
    }, function (err, posts) {
        if (err) {
            req.flash('error', err.message); 
            return res.redirect('/');
        }
        res.render('tags', {
            title: '标签',
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
};
exports.onTag = function (req, res) {
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    Post.getTag({
        tags: req.params.tag, 
        'extInfo.domain': domain
    }, function (err, posts) {
        if (err) {
            req.flash('error',err.message); 
            return res.redirect('/');
        }
        res.render('tag', {
            title: 'TAG:' + req.params.tag,
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
};
exports.onUserPost = function (req, res) {
    var page = req.query.p ? parseInt(req.query.p) : 1,
        requestNo = req.query.requestNO ? parseInt(req.query.requestNO) : 0,
        host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
        type = req.params.type;
    requestNo = requestNo || config.articlePerPage;
    User.getOne({
        username: req.params.username,
        'extInfo.domain': domain
    }, function (err, user) {
        if (!user) {
            req.flash('error', '用户不存在!');
            return res.redirect('/')
        }
        Post.getSome({
            username: user.username,
            'extInfo.domain': user.extInfo.domain
        }, page, requestNo, function (err, posts, total) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('/');
            }
            res.render('user', {
                title: user.username,
                posts: posts,
                user : req.session.user,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * config.articlePerPage + posts.length) == total,
                success : req.flash('success').toString(),
                error : req.flash('error').toString()
            });
        });
    });
};
exports.onSearch = function (req, res) {
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    Post.search({
        'extInfo.domain': domain
    }, req.query.keyword, function (err, posts) {
        if (err) {
            req.flash('error', err.message); 
            return res.redirect('/');
        }
        res.render('search', {
            title: "SEARCH:" + req.query.keyword,
            posts: posts,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
};
exports.offArticle = function (req, res) {
    var currentUser = req.session.user;
    var host = req.get('host'),
        domain = host.replace(/^.*?\./, '');
    Post.remove({
        username: currentUser.username, 
        "time.second": req.params.second, 
        title: req.params.title,
        'extInfo.domain': domain
    }, function (err) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        req.flash('success', '删除成功!');
        res.redirect('/');
    });
};