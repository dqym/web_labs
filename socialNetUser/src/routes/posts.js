const express = require('express');
const { randomUUID } = require('crypto');
const { sanitizeUser } = require('../utils/sanitize-user');

const router = express.Router();

const sortByDateDesc = (collection) =>
  [...collection].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

module.exports = (dataStore) => {
  router.get('/', async (req, res) => {
    const { userId } = req.query;
    const posts = await dataStore.read((data) => {
      if (userId) {
        return data.posts.filter((post) => post.authorId === userId);
      }
      return data.posts;
    });
    res.json(sortByDateDesc(posts));
  });

  router.get('/feed/:userId', async (req, res) => {
    const feed = await dataStore.read((data) => {
      const currentUser = data.users.find((user) => user.id === req.params.userId);
      if (!currentUser) {
        return null;
      }
      const allowed = new Set([currentUser.id, ...currentUser.friends]);
      const posts = data.posts.filter((post) => allowed.has(post.authorId));
      return {
        user: sanitizeUser(currentUser),
        posts: sortByDateDesc(posts)
      };
    });
    if (!feed) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(feed);
  });

  router.post('/', async (req, res) => {
    try {
      const { authorId, content } = req.body;
      if (!authorId || !content) {
        return res.status(400).json({ message: 'authorId and content are required' });
      }
      const newPost = await dataStore.update((draft) => {
        const author = draft.users.find((user) => user.id === authorId);
        if (!author) {
          throw new Error('NOT_FOUND');
        }
        const post = {
          id: randomUUID(),
          authorId,
          content,
          createdAt: new Date().toISOString()
        };
        draft.posts.push(post);
        return post;
      }, { event: 'post:created' });
      return res.status(201).json(newPost);
    } catch (error) {
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ message: 'Author not found' });
      }
      console.error('Post creation failed', error);
      return res.status(500).json({ message: 'Unable to create post' });
    }
  });

  return router;
};
