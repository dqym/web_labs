import express from 'express';
import { nanoid } from 'nanoid';
import {getAllNews, saveAllNews, getAllFriends, getAllUsers} from '../utils/fileDb.js';

const router = express.Router();

// лента новостей друзей пользователя
router.get('/users/:id/news', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const [news, friendsList, usersList] = await Promise.all([getAllNews(), getAllFriends(), getAllUsers()]);
    const rec = friendsList.find((l) => l.userId === userId);
    const friendSet = new Set(rec ? rec.friends : []);
    const feed = news
      .filter((n) => friendSet.has(n.authorId))
      .filter((n) => n.status !== 'blocked')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((n) => {
          const author = usersList.find((u) => u.id === n.authorId);
          return {
              ...n,
              authorName: author.fullName,
          };
      });
    res.json(feed);
  } catch (e) {
    next(e);
  }
});

// создание новости
router.post('/news', async (req, res, next) => {
  try {
    const { authorId, content } = req.body || {};
    if (!authorId || !content) return res.status(400).json({ error: 'authorId and content required' });
    const news = await getAllNews();
    const item = { id: nanoid(10), authorId, content, status: 'active', createdAt: new Date().toISOString() };
    news.push(item);
    await saveAllNews(news);
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

// смена статуса новости
router.patch('/news/:newsId/status', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!['active', 'blocked'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const newsId = req.params.newsId;
    const news = await getAllNews();
    const item = news.find((n) => n.id === newsId);
    if (!item) return res.status(404).json({ error: 'Not found' });
    item.status = status;
    await saveAllNews(news);
    res.json(item);
  } catch (e) {
    next(e);
  }
});

export default router;
