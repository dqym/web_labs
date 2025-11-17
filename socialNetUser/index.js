const http = require('http');
const { app, dataStore } = require('./src/server');
const { attachSockets } = require('./src/sockets/realtime');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
attachSockets(server, dataStore);

server.listen(PORT, () => {
	console.log(`Social Network User server is running on http://localhost:${PORT}`);
});
