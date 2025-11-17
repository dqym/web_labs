const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const DataStore = require('./services/datastore');
const buildUsersRouter = require('./routes/users');
const buildPostsRouter = require('./routes/posts');
const buildMessagesRouter = require('./routes/messages');

const dataFilePath = path.join(__dirname, '..', 'data', 'admin-data.json');
const dataStore = new DataStore(dataFilePath);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.set('dataStore', dataStore);

app.use('/api/users', buildUsersRouter(dataStore));
app.use('/api/posts', buildPostsRouter(dataStore));
app.use('/api/messages', buildMessagesRouter(dataStore));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const clientDistPath = path.join(__dirname, '..', 'client', 'dist', 'client');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

module.exports = {
  app,
  dataStore
};
