import fsp from 'node:fs/promises';
import path from 'node:path';

const ROOT_DIR = path.resolve('.');
const LEGACY_DATA_DIR = path.join(ROOT_DIR, 'src', 'data');
const DEFAULT_DATA = { users: [], posts: [], messages: [] };
const SHARED_DATA_PATH = process.env.ADMIN_DATA_PATH
  ? path.resolve(process.env.ADMIN_DATA_PATH)
  : path.resolve(ROOT_DIR, '..', 'socialNetUser', 'data', 'admin-data.json');

const deepClone = (value) => JSON.parse(JSON.stringify(value));

async function readLegacyJson(file, fallback = []) {
  try {
    const raw = await fsp.readFile(file, 'utf-8');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    console.warn(`Failed to read legacy file ${file}:`, error.message);
    return fallback;
  }
}

function normalizePhotoShape(photo, ownerId) {
  if (!photo || typeof photo !== 'object') return null;
  const status = photo.status === 'blocked' ? 'blocked' : 'active';
  return {
    id: String(photo.id ?? ''),
    userId: ownerId ?? String(photo.userId ?? ''),
    url: String(photo.url ?? ''),
    status,
    uploadedAt: photo.uploadedAt || new Date().toISOString()
  };
}

function normalizeUserShape(user) {
  if (!user || typeof user !== 'object') return null;
  const fullName = user.fullName || user.name || '';
  const role = user.role || (user.isAdmin ? 'admin' : 'user') || 'user';
  const allowedStatuses = ['active', 'blocked', 'unconfirmed'];
  const status = allowedStatuses.includes(user.status) ? user.status : 'active';
  const friends = Array.isArray(user.friends)
    ? Array.from(new Set(user.friends.map((id) => String(id))))
    : [];
  const photos = Array.isArray(user.photos)
    ? user.photos.map((photo) => normalizePhotoShape(photo, user.id)).filter(Boolean)
    : [];
  return {
    ...user,
    id: String(user.id ?? ''),
    fullName,
    name: fullName,
    role,
    status,
    isAdmin: user.isAdmin ?? (role === 'admin'),
    friends,
    photos,
    createdAt: user.createdAt || new Date().toISOString(),
    bio: user.bio ?? '',
    password: user.password ?? '',
    birthdate: user.birthdate ?? null
  };
}

function normalizePostShape(post) {
  if (!post || typeof post !== 'object') return null;
  const status = post.status === 'blocked' ? 'blocked' : 'active';
  return {
    id: String(post.id ?? ''),
    authorId: String(post.authorId ?? ''),
    content: String(post.content ?? ''),
    createdAt: post.createdAt || new Date().toISOString(),
    status
  };
}

function normalizeMessageShape(message) {
  if (!message || typeof message !== 'object') return null;
  return {
    id: String(message.id ?? ''),
    fromUserId: String(message.fromUserId ?? ''),
    toUserId: String(message.toUserId ?? ''),
    content: String(message.content ?? ''),
    createdAt: message.createdAt || new Date().toISOString()
  };
}

function normalizeDataset(raw = {}) {
  const safeUsers = Array.isArray(raw.users) ? raw.users : [];
  const safePosts = Array.isArray(raw.posts) ? raw.posts : [];
  const safeMessages = Array.isArray(raw.messages) ? raw.messages : [];
  return {
    users: safeUsers.map(normalizeUserShape).filter(Boolean),
    posts: safePosts.map(normalizePostShape).filter(Boolean),
    messages: safeMessages.map(normalizeMessageShape).filter(Boolean)
  };
}

async function buildInitialSnapshot() {
  const [legacyUsers, legacyFriends, legacyNews, legacyPhotos] = await Promise.all([
    readLegacyJson(path.join(LEGACY_DATA_DIR, 'users.json'), []),
    readLegacyJson(path.join(LEGACY_DATA_DIR, 'friends.json'), []),
    readLegacyJson(path.join(LEGACY_DATA_DIR, 'news.json'), []),
    readLegacyJson(path.join(LEGACY_DATA_DIR, 'photos.json'), [])
  ]);

  const hasLegacy =
    legacyUsers.length || legacyFriends.length || legacyNews.length || legacyPhotos.length;
  if (!hasLegacy) {
    return deepClone(DEFAULT_DATA);
  }

  const friendMap = new Map(
    legacyFriends.map((entry) => [entry.userId, Array.isArray(entry.friends) ? entry.friends : []])
  );
  const photoMap = new Map();
  legacyPhotos.forEach((photo) => {
    if (!photo || !photo.userId) return;
    const normalized = normalizePhotoShape(photo, photo.userId);
    if (!normalized) return;
    if (!photoMap.has(photo.userId)) photoMap.set(photo.userId, []);
    photoMap.get(photo.userId).push(normalized);
  });

  const users = legacyUsers.map((user) =>
    normalizeUserShape({
      ...user,
      friends: friendMap.get(user.id) || [],
      photos: photoMap.get(user.id) || []
    })
  );

  const posts = legacyNews.map((item) => normalizePostShape(item)).filter(Boolean);

  return {
    users,
    posts,
    messages: []
  };
}

async function ensureSharedFile() {
  try {
    await fsp.access(SHARED_DATA_PATH);
  } catch {
    await fsp.mkdir(path.dirname(SHARED_DATA_PATH), { recursive: true });
    const snapshot = await buildInitialSnapshot();
    const tmp = `${SHARED_DATA_PATH}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(snapshot, null, 2), 'utf-8');
    await fsp.rename(tmp, SHARED_DATA_PATH);
  }
}

async function readDataFile() {
  await ensureSharedFile();
  try {
    const raw = await fsp.readFile(SHARED_DATA_PATH, 'utf-8');
    const parsed = raw.trim() ? JSON.parse(raw) : {};
    return normalizeDataset(parsed);
  } catch (error) {
    console.warn('Failed to read shared admin storage, recreating...', error.message);
    const fallback = await buildInitialSnapshot();
    await writeDataFile(fallback);
    return fallback;
  }
}

async function writeDataFile(nextData) {
  const normalized = normalizeDataset(nextData);
  await fsp.mkdir(path.dirname(SHARED_DATA_PATH), { recursive: true });
  const tmp = `${SHARED_DATA_PATH}.tmp`;
  await fsp.writeFile(tmp, JSON.stringify(normalized, null, 2), 'utf-8');
  await fsp.rename(tmp, SHARED_DATA_PATH);
}

async function updateData(mutator) {
  const data = await readDataFile();
  const result = await mutator(data);
  await writeDataFile(data);
  return result;
}

const prepareUsersForStorage = (users = []) => normalizeDataset({ users }).users;
const preparePostsForStorage = (posts = []) => normalizeDataset({ posts }).posts;

export async function getAllUsers() {
  const data = await readDataFile();
  return data.users.map((user) => deepClone(user));
}

export async function saveAllUsers(users) {
  await updateData((data) => {
    data.users = prepareUsersForStorage(users);
  });
}

export async function getAllFriends() {
  const users = await getAllUsers();
  return users.map((user) => ({
    userId: user.id,
    friends: Array.isArray(user.friends) ? [...user.friends] : []
  }));
}

export async function saveAllFriends(friendLists) {
  const friendMap = new Map(
    (friendLists || []).map((entry) => [
      entry.userId,
      Array.isArray(entry.friends)
        ? Array.from(new Set(entry.friends.map((id) => String(id))))
        : []
    ])
  );
  await updateData((data) => {
    data.users = prepareUsersForStorage(
      data.users.map((user) => ({
        ...user,
        friends: friendMap.has(user.id) ? friendMap.get(user.id) : user.friends || []
      }))
    );
  });
}

export async function getAllNews() {
  const data = await readDataFile();
  return data.posts.map((post) => deepClone(post));
}

export async function saveAllNews(news) {
  await updateData((data) => {
    data.posts = preparePostsForStorage(news);
  });
}

export async function getAllPhotos() {
  const users = await getAllUsers();
  return users.flatMap((user) =>
    Array.isArray(user.photos)
      ? user.photos.map((photo) => deepClone({ ...photo, userId: user.id }))
      : []
  );
}

export async function saveAllPhotos(photos) {
  const grouped = new Map();
  (photos || []).forEach((photo) => {
    if (!photo || !photo.userId) return;
    const normalized = normalizePhotoShape(photo, photo.userId);
    if (!normalized) return;
    if (!grouped.has(photo.userId)) grouped.set(photo.userId, []);
    grouped.get(photo.userId).push(normalized);
  });

  await updateData((data) => {
    data.users = prepareUsersForStorage(
      data.users.map((user) => ({
        ...user,
        photos: grouped.get(user.id) || []
      }))
    );
  });
}
