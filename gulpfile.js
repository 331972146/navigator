var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var fs = require('fs');
var path = require('path');
var htmlclean = require('gulp-htmlclean');
var htmlreplace = require('gulp-html-replace');
var replace = require('gulp-replace');

var paths = {
    sass: ['public/app/scss/**/*.scss'],
        appIndexIn: 'public/app/www/index.html', 
        appConfigIn: 'public/app/www/config.xml', 
        appJsIn: 'public/app/www/js/**/*.js', 
        appLibIn: 'public/app/www/lib/**/*.*', 
        appHtmlIn: 'public/app/www/partials/**/*.html', 
        appImgIn: 'public/app/www/img/**/*.*', 
        appResIn: 'public/app/www/resources/**/*.*', 
        appCssIn: 'public/app/www/css/**/*.css', 
        appIn: ['public/app/www/**/*.*', '!public/app/www/css/**/*.*', '!public/app/www/js/**/*.*', '!public/app/www/partials/**/*.*', '!public/app/www/lib/.gitignore', '!public/app/www/index.html'],
        appOut: 'public/app/build/www/', 
        appQrcode: 'public/app/www/lib/qrcode-generator/js/qrcode.js', 
        appQrcode_utf8: 'public/app/www/lib/qrcode-generator/js/qrcode_UTF8.js', 
        appNg_qrcode: 'public/app/www/lib/angular-qrcode/angular-qrcode.js', 
        appSocket_io: 'public/app/www/lib/socket.io.js', 
        zappIndexIn: 'public/zbtong/www/index.html', 
        zappConfigIn: 'public/zbtong/www/config.xml', 
        zappJsIn: 'public/zbtong/www/js/**/*.js', 
        zappLibIn: 'public/zbtong/www/lib/**/*.*', 
        zappHtmlIn: 'public/zbtong/www/partials/**/*.html', 
        zappImgIn: 'public/zbtong/www/img/**/*.*', 
        zappResIn: 'public/zbtong/www/resources/**/*.*', 
        zappCssIn: 'public/zbtong/www/css/**/*.css', 
        zappIn: ['public/zbtong/www/**/*.*', '!public/zbtong/www/css/**/*.*', '!public/zbtong/www/js/**/*.*', '!public/zbtong/www/partials/**/*.*', '!public/zbtong/www/lib/.gitignore', '!public/zbtong/www/index.html'],
        zappOut: 'public/zbtong/build/www/', 
        zappQrcode: 'public/zbtong/www/lib/qrcode-generator/js/qrcode.js', 
        zappQrcode_utf8: 'public/zbtong/www/lib/qrcode-generator/js/qrcode_UTF8.js', 
        zappNg_qrcode: 'public/zbtong/www/lib/angular-qrcode/angular-qrcode.js', 
        zappSocket_io: 'public/zbtong/www/lib/socket.io.js', 
        webIndexIn: 'public/main.html', 
        webJsIn: 'public/javascript/**/*.js', 
        webLibIn: 'public/lib/**/*.*', 
        webHtmlIn: 'public/partials/**/*.html', 
        webResIn: 'public/res/**/*.*', 
        webCssIn: 'public/stylesheets/**/*.css', 
        webUeditorIn: 'public/ueditor/**/*.*', 
        webUeditorConfigIn: 'public/ueditor/ueditor.config.js', 
        webUploadIn: 'public/upload/.gitignore', 
        webUtilitiesIn: 'public/utilities/**/*.*', 
        webOut: 'public/build/www/', 
        webQrcode: 'public/lib/qrcode-generator/js/qrcode.js', 
        webQrcode_utf8: 'public/lib/qrcode-generator/js/qrcode_UTF8.js', 
        webNg_qrcode: 'public/lib/angular-qrcode/angular-qrcode.js',
        webSocket_io: 'public/lib/socket.io.js',
        mIndexIn: 'public/app/www/index.html',
        mJsIn: 'public/app/www/js/**/*.js', 
        mLibIn: 'public/app/www/lib/**/*.*',
        mHtmlIn: 'public/app/www/partials/**/*.html',
        mImgIn: 'public/app/www/img/**/*.*',
        mCssIn: 'public/app/www/css/**/*.css',
        mIn: ['public/app/www/**/*.*', '!public/app/www/css/**/*.*', '!public/app/www/js/**/*.*', '!public/app/www/partials/**/*.*', '!public/app/www/index.html', '!public/app/www/config.xml', '!public/app/www/resources/**/*.*'],
        mOut: 'public/build/m/',
        mQrcode: 'public/app/www/lib/qrcode-generator/js/qrcode.js', 
        mQrcode_utf8: 'public/app/www/lib/qrcode-generator/js/qrcode_UTF8.js', 
        mNg_qrcode: 'public/app/www/lib/angular-qrcode/angular-qrcode.js', 
        mSocket_io: 'public/app/www/lib/socket.io.js',
        inputJs: ['**/*.js', '!**/build/**/*.*', '!**/lib/**/*.*', '!**/ueditor/**/*.*', '!**/intface/**/*.*', '!**/wwwh5/**/*.*', '!**/demo/**/*.*', '!**/test/**/*.*', '!**/views/**/*.*', '!**/utilities/**/*.*', '!**/hooks/**/*.*', '!**/gulpfile.js', '!**/activitySubCtrl.js', '!**/commoditySubCtrl.js', '!**/staticCtrl.js', '!**/resPonsed.js', '!**/isLogin.js'],
        inputHtml: ['**/*.html', '**/*.css', '!**/build/**/*.*', '!**/lib/**/*.*', '!**/ueditor/**/*.*', '!**/intface/**/*.*', '!**/wwwh5/**/*.*', '!**/demo/**/*.*', '!**/test/**/*.*', '!**/views/**/*.*'],
        outputPath: '../../yiyangbao/yiyangbao/'
};

    gulp.task('all', ['app', 'web', 'm']);

    gulp.task('app', ['minifyAppJs', 'minifyAppLib', 'minifyAppCss', 'cleanAppHtml', 'modAppIndexHtml', 'packApp']); 
    
    gulp.task('zapp', ['minifyzAppJs', 'minifyzAppLib', 'minifyzAppCss', 'cleanzAppHtml', 'modzAppIndexHtml', 'packzApp']); 

    gulp.task('web', ['minifyWebJs', 'minifyWebLib', 'minifyWebCss', 'cleanWebHtml', 'modWebIndexHtml', 'packWeb']);

    gulp.task('m', ['minifyMJs', 'minifyMLib', 'minifyMCss', 'cleanMHtml', 'modMIndexHtml', 'packM']);

    gulp.task('out', ['outputJs', 'outputHtml']);
    gulp.task('lint', ['lapp', 'lzapp', 'lweb', 'lm']);
    gulp.task('lapp', function () {
        gulp.src([paths.appJsIn])
            .pipe(jshint())
            .pipe(jshint.reporter('default'));
    });
    gulp.task('lzapp', function () {
        gulp.src([paths.zappJsIn])
            .pipe(jshint())
            .pipe(jshint.reporter('default'));
    });
    gulp.task('lweb', function () {
        gulp.src([paths.webJsIn])
            .pipe(jshint())
            .pipe(jshint.reporter('default'));
    });
    gulp.task('lm', function () {
        gulp.src([paths.mJsIn])
            .pipe(jshint())
            .pipe(jshint.reporter('default'));
    });

    gulp.task('minifyAppJs', function (done) {
        var outPath = paths.appOut + 'js/';
        gulp.src([paths.appJsIn])
            .pipe(concat('temp.js'))
            .pipe(gulp.dest(outPath))
            .pipe(rename('app.min.js'))
            .pipe(uglify({mangle: false}))
            .pipe(gulp.dest(outPath))
            .on('end', function () {
                fs.unlink(outPath + 'temp.js', function (err) {
                    if (err) throw err;
                    console.log('successfully deleted temp.js');
                    done();
                });
            });
    });
    gulp.task('minifyAppLib', function (done) {
        gulp.src(paths.appQrcode)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.appQrcode)))
        gulp.src(paths.appQrcode_utf8)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.appQrcode_utf8)))
        gulp.src(paths.appNg_qrcode)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.appNg_qrcode)))
        gulp.src(paths.appSocket_io)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.appSocket_io)))
            .on('end', done);
    });
    gulp.task('minifyAppCss', function (done) {
        var outPath = paths.appOut + 'css/';
        gulp.src([paths.appCssIn])
            .pipe(minifyCss({
                keepSpecialComments: 0
            }))
            .pipe(rename({ extname: '.min.css' }))
            .pipe(gulp.dest(outPath))
            .on('end', done);
    });
    gulp.task('cleanAppHtml', function (done) {
        var outPath = paths.appOut + 'partials/';
        gulp.src([paths.appHtmlIn])
            .pipe(htmlclean())
            .pipe(gulp.dest(outPath))
            .on('end', done);
    });
    gulp.task('modAppIndexHtml', function (done) {
        var outPath = paths.appOut;
        gulp.src(paths.appIndexIn)
            .pipe(htmlreplace({
                'qrcode': 'lib/qrcode-generator/js/qrcode.min.js',
                'qrcode_utf8': 'lib/qrcode-generator/js/qrcode_UTF8.min.js',
                'ng_qrcode': 'lib/angular-qrcode/angular-qrcode.min.js',
                'socket_io': 'lib/socket.io.min.js',
                'css': 'css/app.min.css',
                'js': 'js/app.min.js'
            }))
            .pipe(htmlclean(
                {
                    edit: function(html) { 
                      return html.replace(/<base [^>]*\bhref=.+?>/ig, '');
                    }
                }
            ))
            .pipe(gulp.dest(outPath))
            .on('end', done);
    });
    gulp.task('packApp', ['minifyAppJs', 'minifyAppLib', 'minifyAppCss', 'cleanAppHtml'], function () {
        gulp.src(paths.appIn)  
            .pipe(gulp.dest(paths.appOut))
            .on('end', function () {
                console.log('Done!');
            });
    });
    gulp.task('minifyzAppJs', function (done) {
        var outPath = paths.zappOut + 'js/';
        gulp.src([paths.zappJsIn])
            .pipe(concat('temp.js'))
            .pipe(gulp.dest(outPath))
            .pipe(rename('app.min.js'))
            .pipe(uglify({mangle: false}))
            .pipe(gulp.dest(outPath))
            .on('end', function () {
                fs.unlink(outPath + 'temp.js', function (err) {
                    if (err) throw err;
                    console.log('successfully deleted temp.js');
                    done();
                });
            });
    });
    gulp.task('minifyzAppLib', function (done) {
        gulp.src(paths.zappQrcode)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.zappQrcode)))
        gulp.src(paths.zappQrcode_utf8)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.zappQrcode_utf8)))
        gulp.src(paths.zappNg_qrcode)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.zappNg_qrcode)))
        gulp.src(paths.zappSocket_io)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.zappSocket_io)))
            .on('end', done);
    });
    gulp.task('minifyzAppCss', function (done) {
        var outPath = paths.zappOut + 'css/';
        gulp.src([paths.zappCssIn])
            .pipe(minifyCss({
                keepSpecialComments: 0
            }))
            .pipe(rename({ extname: '.min.css' }))
            .pipe(gulp.dest(outPath))
            .on('end', done);
    });
    gulp.task('cleanzAppHtml', function (done) {
        var outPath = paths.zappOut + 'partials/';
        gulp.src([paths.zappHtmlIn])
            .pipe(htmlclean())
            .pipe(gulp.dest(outPath))
            .on('end', done);
    });
    gulp.task('modzAppIndexHtml', function (done) {
        var outPath = paths.zappOut;
        gulp.src(paths.zappIndexIn)
            .pipe(htmlreplace({
                'qrcode': 'lib/qrcode-generator/js/qrcode.min.js',
                'qrcode_utf8': 'lib/qrcode-generator/js/qrcode_UTF8.min.js',
                'ng_qrcode': 'lib/angular-qrcode/angular-qrcode.min.js',
                'socket_io': 'lib/socket.io.min.js',
                'css': 'css/app.min.css',
                'js': 'js/app.min.js'
            }))
            .pipe(htmlclean(
                {
                    edit: function(html) { 
                      return html.replace(/<base [^>]*\bhref=.+?>/ig, '');
                    }
                }
            ))
            .pipe(gulp.dest(outPath))
            .on('end', done);
    });
    gulp.task('packzApp', ['minifyzAppJs', 'minifyzAppLib', 'minifyzAppCss', 'cleanzAppHtml'], function () {
        gulp.src(paths.zappIn)  
            .pipe(gulp.dest(paths.zappOut))
            .on('end', function () {
                console.log('Done!');
            });
    });

    gulp.task('minifyWebJs', function (done) {
        var outPath = paths.webOut + 'javascript/';
        gulp.src([paths.webJsIn])
            .pipe(concat('temp.js'))
            .pipe(gulp.dest(outPath))
            .pipe(rename('app.min.js'))
            .pipe(uglify({mangle: false}))
            .pipe(gulp.dest(outPath))
            .on('end', function () {
                fs.unlink(outPath + 'temp.js', function (err) {
                    if (err) throw err;
                    console.log('successfully deleted temp.js');
                    done();
                });
            });
    });
    gulp.task('minifyWebLib', function (done) {
        gulp.src(paths.webUeditorConfigIn)
            .pipe(uglify({mangle: false}))
            .pipe(rename('ueditor.config.min.js'))
            .pipe(gulp.dest(path.dirname(paths.webUeditorConfigIn)))
        gulp.src(paths.webQrcode)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.webQrcode)))
        gulp.src(paths.webQrcode_utf8)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.webQrcode_utf8)))
        gulp.src(paths.webNg_qrcode)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.webNg_qrcode)))
        gulp.src(paths.webSocket_io)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.webSocket_io)))
            .on('end', done);
    });
    gulp.task('minifyWebCss', function (done) {
        var outPath = paths.webOut + 'stylesheets/';
        gulp.src([paths.webCssIn])
            .pipe(minifyCss({
                keepSpecialComments: 0
            }))
            .pipe(rename({ extname: '.min.css' }))
            .pipe(gulp.dest(outPath))
            .on('end', done);
    });
    gulp.task('cleanWebHtml', function (done) {
        var outPath = paths.webOut + 'partials/';
        gulp.src([paths.webHtmlIn])
            .pipe(htmlclean())
            .pipe(gulp.dest(outPath))
            .on('end', done);
    });
    gulp.task('modWebIndexHtml', function (done) {
        var outPath = paths.webOut;
        gulp.src(paths.webIndexIn)
            .pipe(htmlreplace({
                'qrcode': 'lib/qrcode-generator/js/qrcode.min.js',
                'qrcode_utf8': 'lib/qrcode-generator/js/qrcode_UTF8.min.js',
                'ng_qrcode': 'lib/angular-qrcode/angular-qrcode.min.js',
                'socket_io': 'lib/socket.io.min.js',
                'css': 'stylesheets/style.min.css',
                'js': 'javascript/app.min.js',
                'ueConf': 'ueditor/ueditor.config.min.js',
            }))
            .pipe(htmlclean())
            .pipe(gulp.dest(outPath))
            .on('end', done);
    });
    gulp.task('packWeb', ['minifyWebJs', 'minifyWebLib', 'minifyWebCss', 'cleanWebHtml'], function () {
        gulp.src([paths.webLibIn])  
            .pipe(gulp.dest(paths.webOut + 'lib/'))
        gulp.src([paths.webResIn])  
            .pipe(gulp.dest(paths.webOut + 'res/'))
        gulp.src([paths.webUeditorIn])  
            .pipe(gulp.dest(paths.webOut + 'ueditor/'))
        gulp.src([paths.webUploadIn])  
            .pipe(gulp.dest(paths.webOut + 'upload/'))
        gulp.src([paths.webUtilitiesIn])  
            .pipe(gulp.dest(paths.webOut + 'utilities/'))
        gulp.src('public/intface/**/*.*')  
            .pipe(gulp.dest(paths.webOut + 'intface/'))
            .on('end', function () {
                console.log('Done!');
            });
    });

    gulp.task('minifyMJs', function (done) {
        var outPath = paths.mOut + 'js/';
        gulp.src([paths.mJsIn])
            .pipe(concat('temp.js'))
            .pipe(gulp.dest(outPath))
            .pipe(rename('app.min.js'))
            .pipe(uglify({mangle: false}))
            .pipe(gulp.dest(outPath))
            .on('end', function () {
                fs.unlink(outPath + 'temp.js', function (err) {
                    if (err) throw err;
                    console.log('successfully deleted temp.js');
                    done();
                });
            });
    });
    gulp.task('minifyMLib', function (done) {
        gulp.src(paths.mQrcode)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.mQrcode)))
        gulp.src(paths.mQrcode_utf8)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.mQrcode_utf8)))
        gulp.src(paths.mNg_qrcode)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.mNg_qrcode)))
        gulp.src(paths.mSocket_io)
            .pipe(uglify({mangle: false}))
            .pipe(rename({ extname: '.min.js' }))
            .pipe(gulp.dest(path.dirname(paths.mSocket_io)))
            .on('end', done);
    });
    gulp.task('minifyMCss', function (done) {
        var outPath = paths.mOut + 'css/';
        gulp.src([paths.mCssIn])
            .pipe(minifyCss({
                keepSpecialComments: 0
            }))
            .pipe(rename({ extname: '.min.css' }))
            .pipe(gulp.dest(outPath))
            .on('end', done);
    });
    gulp.task('cleanMHtml', function (done) {
        var outPath = paths.mOut + 'partials/';
        gulp.src([paths.mHtmlIn])
            .pipe(htmlclean())
            .pipe(gulp.dest(outPath))
            .on('end', done);
    });
    gulp.task('modMIndexHtml', function (done) {
        var outPath = paths.mOut;
        gulp.src(paths.mIndexIn)
            .pipe(htmlreplace({
                'qrcode': 'lib/qrcode-generator/js/qrcode.min.js',
                'qrcode_utf8': 'lib/qrcode-generator/js/qrcode_UTF8.min.js',
                'ng_qrcode': 'lib/angular-qrcode/angular-qrcode.min.js',
                'socket_io': 'lib/socket.io.min.js',
                'css': 'css/app.min.css',
                'js': 'js/app.min.js'
            }))
            .pipe(htmlclean())
            .pipe(gulp.dest(outPath))
            .on('end', done);
    });
    gulp.task('packM', ['minifyMJs', 'minifyMLib', 'minifyMCss', 'cleanMHtml'], function () {
        gulp.src(paths.mIn)
            .pipe(gulp.dest(paths.mOut))
            .on('end', function () {
                console.log('Done!');
            });
    });

    gulp.task('rmComments', function (done) {
        gulp.src(paths.inputJs)
            .pipe(replace(/[^\(\{\[\'\"\}\]\)\,\w:]\/\/.*/g, ''))
            .pipe(replace(/([\n\r\f][\s\t\0]*)+([\n\r\f][\s\t\0]*\S*)/g, '$2'))
            .pipe(gulp.dest(paths.outputPath))
            .on('end', done);
    });
    gulp.task('rmSpaces', ['rmComments'], function () {
        return;
    });
        
    gulp.task('outputJs', ['rmSpaces'], function () { 
        console.log('js output');
    });

    gulp.task('outputHtml', function () {
        gulp.src(paths.inputHtml)
            .pipe(gulp.dest(paths.outputPath))
            .on('end', function () {
                console.log('html output');
            });
    });

    gulp.task('watchall', ['all', 'callwatchall']);

    gulp.task('callwatchall', function () {
        gulp.watch([paths.appJs], function () {
            gulp.run('lapp', 'minifyAppJs');
        });
        gulp.watch([paths.appCss], function () {
            gulp.run('minifyAppCss');
        });
        gulp.watch([paths.webJs, paths.exWebJs], function () {
            gulp.run('lapp', 'minifyWebJs');
        });
        gulp.watch([paths.webCss, paths.exWebCss], function () {
            gulp.run('minifyWebCss');
        });
    });

    gulp.task('install', ['git-check'], function () {
        return bower.commands.install()
            .on('log', function (data) {
                gutil.log('bower', gutil.colors.cyan(data.id), data.message);
            });
    });

    gulp.task('git-check', function (done) {
        if (!sh.which('git')) {
            console.log(
                '  ' + gutil.colors.red('Git is not installed.'),
                '\n  Git, the version control system, is required to download Ionic.',
                '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
                '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
            );
            process.exit(1);
        }
        done();
    });