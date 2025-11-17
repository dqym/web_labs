const { Server } = require('socket.io');

const buildRoomName = (userId) => `user:${userId}`;

const attachSockets = (httpServer, dataStore) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*'
    }
  });

  io.on('connection', (socket) => {
    socket.on('joinUser', (payload) => {
      if (!payload || !payload.userId) {
        return;
      }
      socket.join(buildRoomName(payload.userId));
    });

    socket.on('disconnect', () => {
      // nothing yet
    });
  });

  dataStore.on('post:created', ({ result: post }) => {
    io.emit('post:new', post);
  });

  dataStore.on('user:created', ({ result: user }) => {
    if (!user) {
      return;
    }
    io.emit('user:new', user);
  });

  dataStore.on('message:created', ({ result: message }) => {
    io.emit('message:new', message);
  });

  dataStore.on('user:friendsUpdated', ({ result }) => {
    if (!result) {
      return;
    }
    const targets = [];
    if (result.owner) {
      targets.push(result.owner);
    }
    if (result.friend) {
      targets.push(result.friend);
    }
    targets.forEach((user) => {
      io.to(buildRoomName(user.id)).emit('friends:updated', user);
    });
  });

  dataStore.on('externalSync', () => {
    io.emit('data:refresh');
  });

  return io;
};

module.exports = { attachSockets };
