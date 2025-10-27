import gulp from 'gulp';
import pug from 'gulp-pug';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import less from 'gulp-less';
import sourcemaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import uglify from 'gulp-uglify';
import cleanCSS from 'gulp-clean-css';
import { deleteAsync as del } from 'del';
import path from 'node:path';
import fs from 'node:fs';

const sass = gulpSass(dartSass);

const paths = {
  views: {
    src: 'views/**/*.pug',
    pages: ['views/users.pug', 'views/friends.pug', 'views/news.pug'],
    dest: 'dist-gulp'
  },
  styles: {
    scss: {
      src: 'src/client/styles/**/*.scss',
      dest: 'dist-gulp/assets/css'
    },
    less: {
      src: 'src/client/styles/**/*.less',
      dest: 'dist-gulp/assets/css'
    }
  },
  scripts: {
    src: 'src/client/**/*.js',
    dest: 'dist-gulp/assets/js'
  },
  assets: {
    src: 'public/**/*',
    dest: 'dist-gulp'
  }
};

export async function clean() {
  await del(['dist-gulp']);
}

export function templates() {
  return gulp
    .src(paths.views.pages)
    .pipe(
      pug({
        pretty: true,
        locals: {
          title: 'Social Admin',
          cssPath: '/assets/css/main.css',
          cssPathLess: '/assets/css/admin.css',
          jsPath: '/assets/js/app.js'
        }
      })
    )
    .pipe(gulp.dest(paths.views.dest));
}

export function stylesScss() {
  return gulp
    .src('src/client/styles/main.scss')
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        includePaths: ['./node_modules']
      }).on('error', sass.logError)
    )
    .pipe(cleanCSS())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.styles.scss.dest));
}

export function stylesLess() {
  return gulp
    .src('src/client/styles/admin.less')
    .pipe(sourcemaps.init())
    .pipe(less({ javascriptEnabled: true }))
    .pipe(cleanCSS())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.styles.less.dest));
}

export function scripts() {
  return gulp
    .src(['src/client/index.js'])
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['@babel/preset-env']
      })
    )
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.scripts.dest));
}

export function copyAssets() {
  // Если папка public отсутствует — просто пропускаем шаг копирования
  if (!fs.existsSync('public')) {
    return Promise.resolve();
  }
  return gulp.src(paths.assets.src, { allowEmpty: true }).pipe(gulp.dest(paths.assets.dest));
}

export const build = gulp.series(clean, gulp.parallel(templates, stylesScss, stylesLess, scripts, copyAssets));

export function watchFiles() {
  gulp.watch(paths.views.src, templates);
  gulp.watch(paths.styles.scss.src, stylesScss);
  gulp.watch(paths.styles.less.src, stylesLess);
  gulp.watch(paths.scripts.src, scripts);
}

export default gulp.series(build, watchFiles);
