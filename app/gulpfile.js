var gulp = require('gulp');
var sass = require('gulp-sass');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');

var config = {}
config.src = "../src/"
config.dest = "../web/"

gulp.task('sass', function(){
  return gulp.src(config.src + 'scss/**/*.scss')
    .pipe(sass()) // Converts Sass to CSS with gulp-sass
    .pipe(gulp.dest(config.dest + 'css'))
});

gulp.task('useref', function(){
  return gulp.src(config.src + '*.html')
    .pipe(useref())
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulp.dest(config.dest))
});

gulp.task('default', function(){
  gulp.watch(config.src + 'scss/**/*.scss', ['sass']); 
  gulp.watch(config.src + 'js/**/*.js', ['useref']);  
  gulp.watch(config.src + '*.html', ['useref']);  
  // Other watchers
})
