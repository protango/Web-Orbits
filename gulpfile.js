var gulp = require('gulp');
var ts = require('gulp-typescript');
var sass = require('gulp-sass');
var replace = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('views', () =>
    gulp.src("src/views/**/*.html")
        .pipe(replace(/href *= *(["'])(.+?)\.scss\1/gi, 'href=$1$2.css$1'))
        .pipe(replace(/src *= *(["'])(.+?)\.ts\1/gi, 'src=$1$2.js$1'))
        .pipe(gulp.dest("dist/public/views"))
);

gulp.task('styles', () =>
    gulp.src("src/styles/**/*.scss")
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("dist/public/styles"))
);

gulp.task('logic', () => {
    return gulp.src("src/logic/**/*.ts")
        .pipe(sourcemaps.init())
        .pipe(ts({target: "ES6", module: "ES6"}))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/public/logic'))
});

gulp.task('backend', () => {
    return gulp.src("server.ts")
        .pipe(ts({target: "ES6", module: "CommonJS"}))
        .pipe(gulp.dest('dist'))
});

gulp.task('default', gulp.parallel("backend", "logic", "styles", "views"));

gulp.task('watch', () => {
    gulp.watch("src/logic/**/*.ts", gulp.series(["logic"]));
    gulp.watch("src/styles/**/*.scss", gulp.series(["styles"]));
    gulp.watch("src/views/**/*.html", gulp.series(["views"]));
});