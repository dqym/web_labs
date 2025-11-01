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

// добавить друга (зеркально для обоих пользователей)
router.post('/:id/friends', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { friendId } = req.body || {};
    if (!friendId) return res.status(400).json({ error: 'friendId required' });
    if (friendId === userId) return res.status(400).json({ error: 'Cannot add self as friend' });

    const [lists, users] = await Promise.all([getAllFriends(), getAllUsers()]);
    const userExists = users.some((u) => u.id === userId);
    const friendExists = users.some((u) => u.id === friendId);
    if (!userExists || !friendExists) return res.status(400).json({ error: 'User or friend not found' });

    // ensure records exist
    let a = lists.find((l) => l.userId === userId);
    if (!a) {
      a = { userId, friends: [] };
      lists.push(a);
    }
    let b = lists.find((l) => l.userId === friendId);
    if (!b) {
      b = { userId: friendId, friends: [] };
      lists.push(b);
    }

    // add both directions
    if (!a.friends.includes(friendId)) a.friends.push(friendId);
    if (!b.friends.includes(userId)) b.friends.push(userId);

    await saveAllFriends(lists);
    res.status(201).json(a);
  } catch (e) {
    next(e);
  }
});

// удалить друга (зеркально для обоих пользователей)
router.delete('/:id/friends/:friendId', async (req, res, next) => {
  try {
    const { id: userId, friendId } = req.params;
    const lists = await getAllFriends();

    const a = lists.find((l) => l.userId === userId);
    const b = lists.find((l) => l.userId === friendId);

    if (a) a.friends = a.friends.filter((fid) => fid !== friendId);
    if (b) b.friends = b.friends.filter((fid) => fid !== userId);

    await saveAllFriends(lists);
    // Идемпотентность: всегда 204, даже если связки не было
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
