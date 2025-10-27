import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import selfsigned from 'selfsigned';
import usersRouter from './routes/users.js';
import friendsRouter from './routes/friends.js';
import newsRouter from './routes/news.js';
import photosRouter from './routes/photos.js';
import { getAllUsers } from './utils/fileDb.js';

const ROOT = path.resolve('.');
const CERTS_DIR = path.join(ROOT, 'certs');
const KEY_PATH = path.join(CERTS_DIR, 'key.pem');
const CERT_PATH = path.join(CERTS_DIR, 'cert.pem');

async function ensureCerts() {
  try {
    await fsp.access(KEY_PATH);
    await fsp.access(CERT_PATH);
    return { key: await fsp.readFile(KEY_PATH), cert: await fsp.readFile(CERT_PATH) };
  } catch {
    await fsp.mkdir(CERTS_DIR, { recursive: true });
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048 });
    await fsp.writeFile(KEY_PATH, pems.private);
    await fsp.writeFile(CERT_PATH, pems.cert);
    return { key: Buffer.from(pems.private), cert: Buffer.from(pems.cert) };
  }
}

function resolveBuildStatic(app) {
  const gulpDir = path.join(ROOT, 'dist-gulp');
  const webpackDir = path.join(ROOT, 'dist-webpack');
  if (fs.existsSync(gulpDir)) {
    app.use(express.static(gulpDir));
  }
  if (fs.existsSync(webpackDir)) {
    app.use(express.static(webpackDir));
  }
  const publicDir = path.join(ROOT, 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }
}

// Поиск ассетов в доступных статических папках (dist-gulp, dist-webpack, public)
function findAssetUrl(relPath) {
  const candidates = [path.join(ROOT, 'dist-gulp'), path.join(ROOT, 'dist-webpack'), path.join(ROOT, 'public')];
  for (const base of candidates) {
    const full = path.join(base, relPath);
    try {
      if (fs.existsSync(full)) return `/${relPath}`;
    } catch {
      // ignore
    }
  }
  return null;
}

function buildAssetLocals() {
  const cssMain = findAssetUrl('assets/css/main.css') || findAssetUrl('assets/css/app.css');
  // admin.css может быть включён в основной файл при webpack
  const cssAdmin = findAssetUrl('assets/css/admin.css') || cssMain;
  // JS: gulp -> index.js, webpack -> app.js
  const jsPath = findAssetUrl('assets/js/index.js') || findAssetUrl('assets/js/app.js');

  return {
    cssPath: cssMain || undefined,
    cssPathLess: cssAdmin && cssAdmin !== cssMain ? cssAdmin : undefined,
    jsPath: jsPath || undefined
  };
}

export async function startServer() {
  const app = express();

  app.set('view engine', 'pug');
  app.set('views', path.join(ROOT, 'views'));

  app.use(express.json({ limit: '1mb' }));

  resolveBuildStatic(app);

  app.use('/api/users', usersRouter);
  app.use('/api/users', friendsRouter);
  app.use('/api', newsRouter);
  app.use('/api', photosRouter);

  // Страницы
  app.get(['/', '/users'], async (req, res, next) => {
    try {
      const users = await getAllUsers();
      res.render('users', { title: 'Users', users, ...buildAssetLocals() });
    } catch (e) {
      next(e);
    }
  });

  app.get('/users/:id', async (req, res, next) => {
    try {
      const users = await getAllUsers();
      const user = users.find((u) => u.id === req.params.id);
      if (!user) return res.status(404).send('User not found');
      res.render('user_edit', { title: 'Edit user', user, ...buildAssetLocals() });
    } catch (e) {
      next(e);
    }
  });

  app.get('/users/:id/friends', async (req, res, next) => {
    try {
      res.render('friends', { title: 'Friends', userId: req.params.id, ...buildAssetLocals() });
    } catch (e) {
      next(e);
    }
  });

  app.get('/users/:id/news', async (req, res, next) => {
    try {
      res.render('news', { title: 'News', userId: req.params.id, ...buildAssetLocals() });
    } catch (e) {
      next(e);
    }
  });

  // Обработчик ошибок
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8443;
  const host = process.env.HOST || '0.0.0.0';

  try {
    const creds = await ensureCerts();
    const server = https.createServer({ key: creds.key, cert: creds.cert }, app);
    server.listen(port, host, () => {
      console.log(`HTTPS server listening at https://localhost:${port}`);
    });
    return server;
  } catch (e) {
    console.warn('Failed to start HTTPS. Falling back to HTTP. Reason:', e.message);
    const httpPort = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT, 10) : 8080;
    const server = http.createServer(app);
    server.listen(httpPort, host, () => {
      console.log(`HTTP server listening at http://localhost:${httpPort}`);
    });
    return server;
  }
}
