import express from 'express';
import { nanoid } from 'nanoid';
import { getAllPhotos, saveAllPhotos } from '../utils/fileDb.js';

const router = express.Router();

// список фото пользователя
router.get('/users/:id/photos', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const photos = await getAllPhotos();
    res.json(photos.filter((p) => p.userId === userId));
  } catch (e) {
    next(e);
  }
});

// загрузка фото
router.post('/users/:id/photos', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url required' });
    const photos = await getAllPhotos();
    const item = { id: nanoid(10), userId, url, status: 'active', uploadedAt: new Date().toISOString() };
    photos.push(item);
    await saveAllPhotos(photos);
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

// смена статуса фото
router.patch('/photos/:photoId/status', async (req, res, next) => {
  try {
    const photoId = req.params.photoId;
    const { status } = req.body || {};
    if (!['active', 'blocked'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const photos = await getAllPhotos();
    const item = photos.find((p) => p.id === photoId);
    if (!item) return res.status(404).json({ error: 'Not found' });
    item.status = status;
    await saveAllPhotos(photos);
    res.json(item);
  } catch (e) {
    next(e);
  }
});

export default router;
