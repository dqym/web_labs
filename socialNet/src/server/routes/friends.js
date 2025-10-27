import express from 'express';
import { getAllFriends, saveAllFriends, getAllUsers } from '../utils/fileDb.js';

const router = express.Router();

// список друзей пользователя
router.get('/:id/friends', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const [lists, users] = await Promise.all([getAllFriends(), getAllUsers()]);
    const rec = lists.find((l) => l.userId === userId) || { friends: [] };
    const result = rec.friends
      .map((fid) => users.find((u) => u.id === fid))
      .filter(Boolean);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// добавить друга
router.post('/:id/friends', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { friendId } = req.body || {};
    if (!friendId) return res.status(400).json({ error: 'friendId required' });

    const lists = await getAllFriends();
    let rec = lists.find((l) => l.userId === userId);
    if (!rec) {
      rec = { userId, friends: [] };
      lists.push(rec);
    }
    if (!rec.friends.includes(friendId)) {
      rec.friends.push(friendId);
    }
    rec = lists.find((l) => l.userId === friendId);
    if (!rec) {
        rec = { friendId, friends: [] };
        lists.push(rec);
    }
    if (!rec.friends.includes(userId)) {
        rec.friends.push(userId);
    }
    await saveAllFriends(lists);
    res.status(201).json(rec);
  } catch (e) {
    next(e);
  }
});

// удалить друга
router.delete('/:id/friends/:friendId', async (req, res, next) => {
  try {
    const { id: userId, friendId } = req.params;
    const lists = await getAllFriends();
    const rec = lists.find((l) => l.userId === userId);
    if (!rec) return res.status(404).json({ error: 'Not found' });
    rec.friends = rec.friends.filter((fid) => fid !== friendId);
    await saveAllFriends(lists);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
