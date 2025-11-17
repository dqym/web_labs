const express = require('express');
const { randomUUID } = require('crypto');
const { sanitizeUser, sanitizeUsers } = require('../utils/sanitize-user');

const router = express.Router();

module.exports = (dataStore) => {
  router.get('/', async (_req, res) => {
    const users = await dataStore.read((data) => sanitizeUsers(data.users));
    res.json(users);
  });

  router.get('/:id', async (req, res) => {
    const userId = req.params.id;
    const user = await dataStore.read((data) =>
      sanitizeUser(data.users.find((u) => u.id === userId))
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await dataStore.read((data) =>
      data.users.find(
        (u) =>
          u.email.toLowerCase() === String(email).toLowerCase() &&
          u.password === password
      )
    );
    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }
    return res.json(sanitizeUser(user));
  });

  router.post('/register', async (req, res) => {
    try {
      const { name, email, password, photoUrl = '', isAdmin = false } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' });
      }

      const duplicate = await dataStore.read((data) =>
        data.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase())
      );
      if (duplicate) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }

      const createdAt = new Date().toISOString();
      const newUser = {
        id: randomUUID(),
        name,
        email,
        password,
        isAdmin,
        photoUrl,
        friends: [],
        bio: '',
        createdAt
      };

      await dataStore.update((draft) => {
        draft.users.push(newUser);
        return newUser;
      }, { event: 'user:created' });

      return res.status(201).json(sanitizeUser(newUser));
    } catch (error) {
      console.error('Register user failed', error);
      return res.status(500).json({ message: 'Failed to register user' });
    }
  });

  router.put('/:id/photo', async (req, res) => {
    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ message: 'photoUrl is required' });
    }
    try {
      const updatedUser = await dataStore.update((draft) => {
        const target = draft.users.find((u) => u.id === req.params.id);
        if (!target) {
          throw new Error('NOT_FOUND');
        }
        target.photoUrl = photoUrl;
        return target;
      }, { event: 'user:photoUpdated' });
  return res.json(sanitizeUser(updatedUser));
    } catch (error) {
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ message: 'User not found' });
      }
      console.error('Photo update failed', error);
      return res.status(500).json({ message: 'Unable to update photo' });
    }
  });

  router.delete('/:id/photo', async (req, res) => {
    try {
      await dataStore.update((draft) => {
        const target = draft.users.find((u) => u.id === req.params.id);
        if (!target) {
          throw new Error('NOT_FOUND');
        }
        target.photoUrl = '';
        return target;
      }, { event: 'user:photoRemoved' });
      return res.status(204).send();
    } catch (error) {
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ message: 'User not found' });
      }
      console.error('Photo remove failed', error);
      return res.status(500).json({ message: 'Unable to remove photo' });
    }
  });

  router.post('/:id/friends', async (req, res) => {
    const { friendId } = req.body;
    if (!friendId) {
      return res.status(400).json({ message: 'friendId is required' });
    }
    try {
      const { owner } = await dataStore.update((draft) => {
        const currentUser = draft.users.find((u) => u.id === req.params.id);
        const friend = draft.users.find((u) => u.id === friendId);
        if (!currentUser || !friend) {
          throw new Error('NOT_FOUND');
        }
        if (!currentUser.friends.includes(friendId)) {
          currentUser.friends.push(friendId);
        }
        if (!friend.friends.includes(req.params.id)) {
          friend.friends.push(req.params.id);
        }
        return { owner: currentUser, friend };
      }, { event: 'user:friendsUpdated' });
  return res.json(sanitizeUser(owner));
    } catch (error) {
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ message: 'User or friend not found' });
      }
      console.error('Add friend failed', error);
      return res.status(500).json({ message: 'Unable to update friends list' });
    }
  });

  router.delete('/:id/friends/:friendId', async (req, res) => {
    try {
      await dataStore.update((draft) => {
        const currentUser = draft.users.find((u) => u.id === req.params.id);
        const friend = draft.users.find((u) => u.id === req.params.friendId);
        if (!currentUser || !friend) {
          throw new Error('NOT_FOUND');
        }
        currentUser.friends = currentUser.friends.filter((fid) => fid !== req.params.friendId);
        friend.friends = friend.friends.filter((fid) => fid !== req.params.id);
        return { owner: currentUser, friend };
      }, { event: 'user:friendsUpdated' });
      return res.status(204).send();
    } catch (error) {
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ message: 'User or friend not found' });
      }
      console.error('Remove friend failed', error);
      return res.status(500).json({ message: 'Unable to update friends list' });
    }
  });

  return router;
};
