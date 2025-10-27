import express from 'express';
import { nanoid } from 'nanoid';
import { getAllUsers, saveAllUsers, getAllFriends, saveAllFriends } from '../utils/fileDb.js';
import { validateUser } from 'user-utils';

const router = express.Router();

// Получить список пользователей
router.get('/', async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (e) {
    next(e);
  }
});

// Получить пользователя по id
router.get('/:id', async (req, res, next) => {
  try {
    const users = await getAllUsers();
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

// Создать пользователя
router.post('/', async (req, res, next) => {
  try {
    const payload = req.body || {};
    const [valid, errors] = validateUser(payload);
    if (!valid) return res.status(400).json({ error: 'Validation failed', details: errors });

    const users = await getAllUsers();
    const id = nanoid(10);
    const user = {
      id,
      fullName: payload.fullName,
      birthdate: payload.birthdate || null,
      email: payload.email,
      photoUrl: payload.photoUrl || '',
      role: payload.role || 'user',
      status: payload.status || 'unconfirmed'
    };
    users.push(user);
    await saveAllUsers(users);
    // Инициализируем список друзей
    const friends = await getAllFriends();
    friends.push({ userId: id, friends: [] });
    await saveAllFriends(friends);

    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
});

// Обновить пользователя
router.put('/:id', async (req, res, next) => {
  try {
    const payload = req.body || {};
    const users = await getAllUsers();
    const idx = users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    const cur = users[idx];
    const merged = { ...cur, ...payload, id: cur.id };
    const [valid, errors] = validateUser(merged);
    if (!valid) return res.status(400).json({ error: 'Validation failed', details: errors });

    users[idx] = merged;
    await saveAllUsers(users);
    res.json(merged);
  } catch (e) {
    next(e);
  }
});

// Удалить пользователя
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const users = await getAllUsers();
    const nextUsers = users.filter((u) => u.id !== id);
    if (nextUsers.length === users.length) return res.status(404).json({ error: 'Not found' });
    await saveAllUsers(nextUsers);

    // Удалить из друзей
    const friendLists = await getAllFriends();
    friendLists.forEach((fl) => {
      fl.friends = fl.friends.filter((fid) => fid !== id);
    });
    const cleaned = friendLists.filter((fl) => fl.userId !== id);
    await saveAllFriends(cleaned);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// Смена роли
router.patch('/:id/role', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { role } = req.body || {};
    if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const users = await getAllUsers();
    const user = users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    user.role = role;
    await saveAllUsers(users);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

// Смена статуса
router.patch('/:id/status', async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status } = req.body || {};
    if (!['unconfirmed', 'active', 'blocked'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const users = await getAllUsers();
    const user = users.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    user.status = status;
    await saveAllUsers(users);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

export default router;
