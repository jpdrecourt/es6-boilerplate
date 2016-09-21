/*
* ES6 Boilerplate for project Automation
* Inspired by Jean-Pierre Sierens.
* Author: Jean-Philippe Drecourt
*/

// Declarations & dependencies
// ----------------------------------------------------------------------------
var gulp = require('gulp'); // Task Automation
var gutil = require('gulp-util'); // Utilities for Gulp like logging
var browserify = require('browserify'); // Turning nodeJS into browser compatible JS
var source = require('vinyl-source-stream'); // Allows to use normal text streams
var babelify = require('babelify'); // Transpiler
var htmlPages = ['src/*.html'];

// External dependencies that don't need to be rebundled while developing
// They'll be bundled once and for all in 'vendor.js'
// In production, they'll be included in 'bundle.js'
var dependencies = [

];
// Count of the times a tasks refires (with gulp.watch)
var scriptsCount = 0;

//Gulp tasks
// ----------------------------------------------------------------------------
// Development task - Don't bundle the dependencies
gulp.task('scripts', function () {
  bundleApp(false);
});
// Copy HTML page in separate task to avoid recompiling JS
// TODO CSS pages
gulp.task('copy-html', function () {
  gulp.src(htmlPages)
    .pipe(gulp.dest('dev'));
});
// Deployment task - Bundle everything into one script and copy HTML pages
// Destination directory: ./dist
gulp.task('deploy', function () {
  gulp.src(htmlPages)
    .pipe(gulp.dest('dist'));
  bundleApp(true);
});

// Watch task - Reruns scripts task everytime something changes
// Destination directory: dist
gulp.task('watch', function () {
  gulp.watch(['./src/*.js'], ['scripts']);
  gulp.watch(['./src/*.html'], ['copy-html']);
});

// Default task - Called by 'gulp' on terminal
// Runs the task 'scripts' and then keeps watch for changes in every .js file
gulp.task('default', ['scripts', 'copy-html', 'watch']);

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

  }
  else
  {
    rootDir = './dev';
    // Make the dependencies external to avoid bundling in bundle.js
    // Dependencies are bundled in vendor.js in development
    dependencies.forEach(function (dep) {
      appBundler.external(dep);
    });
  }

  appBundler
    // Transform ES6 and JSX to ES5 with babelify
    .transform('babelify', {presets: ['es2015']})
    .bundle()
    .on('error', gutil.log)
    .pipe(source('bundle.js'))
    .pipe(gulp.dest(rootDir + '/web/js/'));
}
