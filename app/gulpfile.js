var gulp = require('gulp');
var sass = require('gulp-sass');

var config = {}
config.src = "../src/"
config.dest = "../web/"

gulp.task('sass', function(){
  return gulp.src(config.src + 'scss/**/*.scss')
    .pipe(sass()) // Converts Sass to CSS with gulp-sass
    .pipe(gulp.dest(config.dest + 'css'))
});

gulp.task('dev', function(){
  gulp.watch(config.src + 'scss/**/*.scss', ['sass']); 
  // Other watchers
})
