/*
 * ES6 Boilerplate for project Automation
 * Inspired by Jean-Pierre Sierens.
 * Author: Jean-Philippe Drecourt
 */

// Declarations & dependencies
// ----------------------------------------------------------------------------
var fs = require('fs'); // To read local files
var gulp = require('gulp'); // Task Automation
var gutil = require('gulp-util'); // Utilities for Gulp like logging
var browserify = require('browserify'); // Turning nodeJS into browser compatible JS
var source = require('vinyl-source-stream'); // Allows to use normal text streams
var babelify = require('babelify'); // Transpiler
var webserver = require('gulp-webserver'); // Webserver with LiveReaload
var sass = require('gulp-sass'); // SASS compiler
var preprocess =require('gulp-preprocess'); // Preprocessing files
var symlink = require('gulp-sym'); // Symlink in development
var prefix = require('gulp-autoprefixer'); // Browser compatibility
var htmlPages = ['src/**/*.html']; // HTML pages to watch
var scssPages = ['src/**/*.scss']; // CSS pages to watch

// External dependencies that don't need to be rebundled while developing
// They'll be bundled once and for all in 'vendor.js'
// In production, they'll be included in 'bundle.js'
// Extracted directly from package.json for simplicity.
var packageData = JSON.parse(fs.readFileSync('./package.json'));
var dependencies = Object.getOwnPropertyNames(packageData.dependencies);
// Count of the times a tasks refires (with gulp.watch)
var scriptsCount = 0;

//Gulp tasks
// ----------------------------------------------------------------------------
// Development task - Don't bundle the dependencies
gulp.task('scripts', function() {
  return bundleApp(false);
});
// Copy HTML page in separate task to avoid recompiling JS
gulp.task('copy-html', function() {
  return gulp.src(htmlPages)
  .pipe(preprocess({context: {NODE_ENV: 'development'}}))
  .pipe(gulp.dest('dev'));
});
// SASS, CSS and prefix
gulp.task('sass', function() {
  return gulp.src(scssPages)
    .pipe(sass({
      indentedSyntax: true
    }).on('error', sass.logError))
    .pipe(prefix({
      browsers: ['last 15 versions', '> 1%', 'ie 8', 'ie 7'],
      cascade: true
    }))
    .pipe(gulp.dest('dev/web/css'));
});
// Symlink to media for development
gulp.task('assets', function() {
  fs.stat('./dev/web/assets', function(err) {
    if (err !== null) {
      return gulp.src('assets')
      .pipe(symlink('dev/web/assets'));
    }
  });
});
// Webserver task for Development
gulp.task('webserver', ['scripts', 'copy-html', 'sass', 'assets'], function() {
  gulp.src('./dev/')
    .pipe(webserver({
      livereload: true,
      open: true
    }));
});
// Deployment task - Bundle everything into one script and copy HTML pages
// Destination directory: ./dist
gulp.task('deploy', function() {
  gulp.src(htmlPages)
    .pipe(preprocess({context: {NODE_ENV: 'production'}}))
    .pipe(gulp.dest('dist'));
  gulp.src(scssPages)
    .pipe(sass({
      indentedSyntax: true
    }).on('error', sass.logError))
    .pipe(prefix({
      browsers: ['last 15 versions', '> 1%', 'ie 8', 'ie 7'],
      cascade: true
    }))
    .pipe(gulp.dest('dist/web/css'));
  gulp.src(['./assets/**/*'])
    .pipe(gulp.dest('./dist/web/assets'));
  bundleApp(true);
});

// Watch task - Reruns scripts task everytime something changes
// Destination directory: dist
gulp.task('watch', function() {
  gulp.watch(['./src/**/*.js'], ['scripts']);
  gulp.watch(['./src/**/*.html'], ['copy-html']);
  gulp.watch(['./src/**/*.scss'], ['sass']);
});

// Default task for development - Called by 'gulp' on terminal
gulp.task('default', ['scripts', 'copy-html', 'sass', 'webserver', 'watch']);

// Private Functions
// ----------------------------------------------------------------------------
function bundleApp(isProduction) {
  scriptsCount++;
  // Root directory for the compiled files
  // In production, copies the full devsite structure into dist.
  var rootDir;
  // Use browserify to bundle all the js files together to use them in the
  // front end
  var appBundler = browserify({
    entries: './src/app.js',
    debug: !isProduction // We don't want the maps in production
  });

  // If it's not for production, create a separate vendors.js with
  // the dependencies that don't change.
  // If the file exists, then do not recreate it.
  if (!isProduction && scriptsCount === 1) {
    browserify({
        require: dependencies,
        debug: true
      })
      .bundle()
      .on('error', gutil.log)
      .pipe(source('vendors.js'))
      .pipe(gulp.dest('./dev/web/js/'));
  }
  if (isProduction) {
    rootDir = './dist';
    // Copy all the HTML files there to ease copying

  } else {
    rootDir = './dev';
    // Make the dependencies external to avoid bundling in bundle.js
    // Dependencies are bundled in vendor.js in development
    dependencies.forEach(function(dep) {
      appBundler.external(dep);
    });
  }

  return appBundler
  // Transform ES6 and JSX to ES5 with babelify
    .transform('babelify', {
      presets: ['es2015']
    })
    .bundle()
    .on('error', function (error) {
      gutil.log(error);
      this.emit('end');})
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(rootDir + '/web/js/'))
    .on('finish', function () {
      gulp.src(rootDir + '/web/js/bundle.js')
        .pipe(preprocess({context: {NODE_ENV: isProduction ? 'production' : 'development'}}))
        .pipe(gulp.dest(rootDir + '/web/js/'));
    });
}
