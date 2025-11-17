const express = require('express');
const { randomUUID } = require('crypto');
const { sanitizeUser } = require('../utils/sanitize-user');

const router = express.Router();

const sortMessages = (messages) =>
  [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

module.exports = (dataStore) => {
  router.get('/', async (req, res) => {
    const { userId, peerId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    const result = await dataStore.read((data) => {
      const user = data.users.find((u) => u.id === userId);
      if (!user) {
        return null;
      }
      let messages = data.messages.filter((message) =>
        message.fromUserId === userId || message.toUserId === userId
      );
      if (peerId) {
        const peer = data.users.find((u) => u.id === peerId);
        if (!peer) {
          return 'PEER_MISSING';
        }
        messages = messages.filter(
          (message) =>
            (message.fromUserId === userId && message.toUserId === peerId) ||
            (message.fromUserId === peerId && message.toUserId === userId)
        );
      }
      return {
        user: sanitizeUser(user),
        messages: sortMessages(messages)
      };
    });

    if (result === 'PEER_MISSING') {
      return res.status(404).json({ message: 'Peer not found' });
    }
    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result);
  });

  router.post('/', async (req, res) => {
    const { fromUserId, toUserId, content } = req.body;
    if (!fromUserId || !toUserId || !content) {
      return res.status(400).json({ message: 'fromUserId, toUserId and content are required' });
    }
    try {
      const newMessage = await dataStore.update((draft) => {
        const fromUser = draft.users.find((u) => u.id === fromUserId);
        const toUser = draft.users.find((u) => u.id === toUserId);
        if (!fromUser || !toUser) {
          throw new Error('NOT_FOUND');
        }
        const message = {
          id: randomUUID(),
          fromUserId,
          toUserId,
          content,
          createdAt: new Date().toISOString()
        };
        draft.messages.push(message);
        return message;
      }, { event: 'message:created' });
      return res.status(201).json(newMessage);
    } catch (error) {
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ message: 'User not found' });
      }
      console.error('Message creation failed', error);
      return res.status(500).json({ message: 'Unable to create message' });
    }
  });

  return router;
};
