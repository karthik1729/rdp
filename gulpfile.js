var gutil = require('gulp-util'),
    gulp  = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    coffee = require('gulp-coffee');

gulp.task('coffee', function() {
  gulp.src('./src/core.coffee')
    .pipe(sourcemaps.init())
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./lib'))
});

gulp.task('watch', function() {
    gulp.watch("./*.coffee", ["coffee"])
});


gulp.task('default', ['coffee']);
gulp.start("watch");
