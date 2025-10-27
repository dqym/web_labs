import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve('src/data');

async function ensureFile(file, initial = '[]') {
  try {
    await fsp.access(file);
  } catch {
    await fsp.mkdir(path.dirname(file), { recursive: true });
    await fsp.writeFile(file, initial, 'utf-8');
  }
}

async function readJson(file) {
  await ensureFile(file);
  const content = await fsp.readFile(file, 'utf-8');
  try {
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
}

async function writeJson(file, data) {
  await ensureFile(file);
  const tmp = `${file}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
  await fsp.rename(tmp, file);
}

const USERS_PATH = path.join(DATA_DIR, 'users.json');
const FRIENDS_PATH = path.join(DATA_DIR, 'friends.json');
const NEWS_PATH = path.join(DATA_DIR, 'news.json');
const PHOTOS_PATH = path.join(DATA_DIR, 'photos.json');

export async function getAllUsers() {
  return readJson(USERS_PATH);
}

export async function saveAllUsers(users) {
  return writeJson(USERS_PATH, users);
}

export async function getAllFriends() {
  return readJson(FRIENDS_PATH);
}

export async function saveAllFriends(friendLists) {
  return writeJson(FRIENDS_PATH, friendLists);
}

export async function getAllNews() {
  return readJson(NEWS_PATH);
}

export async function saveAllNews(news) {
  return writeJson(NEWS_PATH, news);
}

export async function getAllPhotos() {
  return readJson(PHOTOS_PATH);
}

export async function saveAllPhotos(photos) {
  return writeJson(PHOTOS_PATH, photos);
}
