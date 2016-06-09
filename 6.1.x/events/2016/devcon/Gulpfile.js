var gulp = require('gulp');
var svgmin = require('gulp-svgmin');
var rename = require("gulp-rename");
var ext_replace = require('gulp-ext-replace');
var svgSprite = require('gulp-svg-sprite');
var concat = require("gulp-concat");

var winston = require("winston");
var logger = new winston.Logger({
    level: 'debug',
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
            name: 'debug-file',
            filename: 'logs/debug.log',
            level: 'debug'
        }),
        new (winston.transports.File)({
            name: 'silly-file',
            filename: 'logs/trace.log',
            level: 'silly'
        })
    ]
});

var fs = require("fs");
var config = JSON.parse(fs.readFileSync('./config.json'));
var environment = config.environment.prod;

gulp.task("dev", function () {
   environment = config.environment.dev; 
   logger.info("environment changed to: " ,  environment);
});

var syncdir = "/Users/allenziegenfus/Documents/liferay-sync61/Events 2016/DEVCON";
var paths = {
    scripts: ['src/liferay/**/*.js'],
    liferaycss: ['src/liferay/**/*.css'],
    pug: ['src/*.pug'],
    css: ['src/**/*.scss'],
    svg: ['images/*.svg'],
    html: ['src/*.html'],
    js: ['src/js/*.js']
    
};

var browserSync = require('browser-sync').create();

// Static server
gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: "build/"
        },
        plugins: ["browser-sync-logger"]
    });
    gulp.watch("build/index.html").on('change', browserSync.reload);

});

gulp.task("js", function() {
    var inject= require("gulp-inject-string");
   gulp.src(paths.js)
   .pipe(concat('alldevcon.js'))
   .pipe(inject.prepend("<script>"))
   .pipe(inject.append("</script>"))
   .pipe(gulp.dest("build"));
});

gulp.task('pug', ["js", "liferaycss","scripts","sprite", "css"], function buildHTML() {
    logger.info("Running templates");
    var pug = require('gulp-pug');
    return gulp.src(paths.pug)
        .pipe(pug({ locals: environment
        }))
        .pipe(gulp.dest("build"));
});

gulp.task('clean', function() {
  var del = require('del');
  // You can use multiple globbing patterns as you would with `gulp.src`
  return del(['build']);
});

gulp.task('scripts', function() {
  // Minify and copy all JavaScript (except vendor scripts)
  // with sourcemaps all the way down
  return gulp.src(paths.scripts)
      .pipe(concat('all.min.js'))
     .pipe(gulp.dest('build/'));
});

gulp.task('liferaycss', function() {
  // Minify and copy all JavaScript (except vendor scripts)
  // with sourcemaps all the way down
  return gulp.src(paths.liferaycss)
      .pipe(concat('all.css'))
     .pipe(gulp.dest('build/'));
});

gulp.task('watch', function () {
    gulp.watch(paths.pug, ['pug']);
     gulp.watch(paths.css, ['css', 'pug']);
     gulp.watch(paths.svg, ['pug']);
       gulp.watch(paths.html, ['pug']);
     gulp.watch(paths.scripts, ['scripts', 'pug']);
     gulp.watch(paths.js, ['js', 'pug']);
});

gulp.task('live-dev', ['dev', 'pug', 'watch', 'browser-sync']);

gulp.task('svgmin', function () {
    return gulp.src('images/*.svg')
        .pipe(svgmin())
        .pipe(gulp.dest('build'))
        .pipe(gulp.dest(syncdir))
        ;
});




gulp.task("sprite", function (cb) {
    var config = {
        log: "info",
        mode: {
            symbol: {
                inline: true
            },
            dest: "out"
        }
    };

    logger.info("Creating SVG sprite");
    gulp.src('**/*.svg', { cwd: 'images' })
        .pipe(svgSprite(config))
        .pipe(gulp.dest('build'))
        .on("end", function () {
           
            logger.info("Renaming Sprite File");
            gulp.src('build/symbol/svg/sprite.symbol.svg')
                .pipe(rename("devconsprite.svg"))
                .pipe(gulp.dest('build'))
                .on("end", cb);
        });
    
});

gulp.task('css', function (cb) {
    var postcss = require('gulp-postcss');
    var gulpStylelint = require('gulp-stylelint');
    var fs = require('fs');
    logger.info("environment: ",  environment);

    return gulp.src(paths.css)
        .pipe(postcss([ 
        require('precss'),
        require("css-mqpacker"),
         require('postcss-advanced-variables')({   variables: 
        environment
     })
        ]))
        .pipe(ext_replace(".css"))
        /*       .pipe(gulpStylelint({   reporters: [
             {formatter: 'string', console: true}
           ]}))*/
        .pipe(gulp.dest('build/'));
        
});


gulp.task('images', function () {

    var imageOptim = require('gulp-imageoptim');

    return gulp.src('images/*')
        .pipe(imageOptim.optimize({
            jpegmini: false
        }))
        .pipe(gulp.dest('build/images'));
});


gulp.task('update', ["js", "pug"], function () {
    var biggulp = require("./biggulp.js");
    var fs = require("fs");
    var config = JSON.parse(fs.readFileSync('./config.json'));
    var articleConfig = JSON.parse(fs.readFileSync('./articleconfig.json'));
    
    articleConfig.forEach(function(article) {  
        biggulp.updateStaticArticleContent(config, article); 
    });
});

gulp.task('default', ["sprite", "css", "pug"]);
gulp.task('get-content', function () {
    var biggulp = require("./biggulp.js");
    var fs = require("fs");
    var config = JSON.parse(fs.readFileSync('./config.json'));
    //var articleConfig = JSON.parse(fs.readFileSync('./articleconfig.json'));
    var articleConfig = JSON.parse(fs.readFileSync('./article-lookup-config.json'));
    /*var articleConfig = [
        {
        "groupId": "67510365",
        "articleId": "74591624",
        "urlTitle": "devcon-call-for-papers-web-events2016-devcon"
        }];   
          articleConfig = [
        {
        "groupId": "39527293",
        "articleId": "39575459",
        "urlTitle": "devcon-call-for-papers-web-events2014-devcon"
        }]; */  
    
    articleConfig.forEach(function(article) { 
        biggulp.viewArticleContent(config, article, "en_US");
      //  biggulp.getDisplayArticleByTitle(config, article); 
       // biggulp.getArticle(config, article);
    //    biggulp.getArticleContent(config, article, "en_US"); 
    });
});

gulp.task('perms', function () {
    var biggulp = require("./biggulp.js");
    
    var cmd = {
        "/permission/check-permission": {
            "groupId": 67510365,
            "resourceId": 663854
        }
    };
    
    // https://web.liferay.com/de/web/mohit.soni/blog/-/blogs/deep-dive-in-roles-and-permissions
    var cmd = {
       '/resource/get-resource': {
  
          companyId: 1,
            name: 'com.liferay.portal.model.Layout',
      scope: 4 ,
     primKey: '67504546'
    }
        
    };
    
    
    
    var cmd = {
        "/layout/get-layouts": {
            "groupId": 67510365,
            "privateLayout": false
        }
    };
        var cmd = {
        "/permission/check-permission": {
            "groupId": 67510365,
            "name": "com.liferay.portal.model.Layout",
            "primKey": "74815470"
        }
    };
    

    
      var cmd = {
        "/role/get-group-roles": {
         "groupId": 22
        }
    };
    
       var cmd = {
        "/role/get-user-roles": {
         "userId": 66748356
        }
    };
    
        
     var cmd = {
        "/role/get-role": {
         "companyId": 1,
         "name": "Guest"
        }
    };
    
        var cmd = {
        "/role/get-user-group-roles": {
         "userId": 66748356,
         groupId: 67510365
        }
    };
    
      var cmd = {
        "/role/get-role": {
         "companyId": 1,
         "name": "Guest"
        }
    };
    
        var cmd = {
        "/permission/check-permission": {
            "groupId": 11,
            "name": "com.liferay.portal.model.Layout",
            "primKey": "74815470"
        }
    };
    var cmd = {"/ddlrecordset/get-record-set": {
     
            recordSetId: 36416693    }
    
    };
    
        var cmd = {"/ddmstructure/get-structure": {
     
            structureId: 36369534    }
    
    }
    biggulp.invoke_liferay(config, cmd, function(body) {
        console.log("we are now done", body);
    });
});