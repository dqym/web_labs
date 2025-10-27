import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import selfsigned from 'selfsigned';
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

export async function startServer() {
    const app = express();

    // Подключаем папку Webpack
    const webpackDir = path.join(ROOT, 'dist-webpack');
    app.use(express.static(webpackDir));

    // Остальные статические ассеты (если нужны)
    const publicDir = path.join(ROOT, 'public');
    if (fs.existsSync(publicDir)) app.use(express.static(publicDir));

    app.use(express.json({ limit: '1mb' }));

    // API остаётся без изменений, их можно подключать
    // app.use('/api/users', usersRouter);
    // app.use('/api/users', friendsRouter);
    // app.use('/api', newsRouter);
    // app.use('/api', photosRouter);

    // Страницы: вместо res.render просто отдаем готовый HTML
    app.get(['/', '/users'], (req, res) => {
        res.sendFile(path.join(webpackDir, 'users.html'));
    });

    app.get('/users/:id', (req, res) => {
        res.sendFile(path.join(webpackDir, 'user_edit.html'));
    });

    app.get('/users/:id/friends', (req, res) => {
        res.sendFile(path.join(webpackDir, 'friends.html'));
    });

    app.get('/users/:id/news', (req, res) => {
        res.sendFile(path.join(webpackDir, 'news.html'));
    });

    // Обработчик ошибок
    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    });

    const port = process.env.PORT ? parseInt(process.env.PORT) : 8443;
    const host = process.env.HOST;

    try {
        const creds = await ensureCerts();
        const server = https.createServer({ key: creds.key, cert: creds.cert }, app);
        server.listen(port, host, () => {
            console.log(`HTTPS server listening at https://localhost:${port}`);
        });
        return server;
    } catch (e) {
        console.warn('Failed to start HTTPS. Falling back to HTTP. Reason:', e.message);
        const httpPort = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 8080;
        const server = http.createServer(app);
        server.listen(httpPort, host, () => {
            console.log(`HTTP server listening at http://localhost:${httpPort}`);
        });
        return server;
    }
}
