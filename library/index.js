// Simple Library Manager - Express + Pug + JSON storage
const path = require('path');
const fs = require('fs');

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'books.json');

// Middleware
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure data file exists
async function ensureDataFile() {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.promises.access(DATA_FILE, fs.constants.F_OK);
  } catch {
    await fs.promises.writeFile(DATA_FILE, '[]', 'utf8');
  }
}

async function readBooks() {
  await ensureDataFile();
  const raw = await fs.promises.readFile(DATA_FILE, 'utf8');
  const data = JSON.parse(raw || '[]');
  return Array.isArray(data) ? data : [];
}

async function writeBooks(books) {
  await ensureDataFile();
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(books, null, 2), 'utf8');
}

function nextId(books) {
  const max = books.reduce((m, b) => (typeof b.id === 'number' ? Math.max(m, b.id) : m), 0);
  return max + 1;
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDateOnly(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return dt.toISOString().slice(0, 10);
}

// Pages
app.get('/', (req, res) => res.redirect('/books'));

app.get('/books', async (req, res, next) => {
  try {
    const books = await readBooks();
    res.render('books/index', { title: 'Библиотека', books });
  } catch (e) {
    next(e);
  }
});

app.get('/books/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const books = await readBooks();
    const book = books.find(b => b.id === id);
    if (!book) {
      res.status(404).render('404', { title: 'Не найдено', message: 'Книга не найдена' });
      return;
    }
    res.render('books/show', { title: `${book.title} — карточка`, book });
  } catch (e) {
    next(e);
  }
});

// REST API
app.get('/api/books', async (req, res, next) => {
  try {
    const books = await readBooks();
    let result = books.slice();

    const { available, overdue, dueBefore, q } = req.query;

    if (available === 'true') {
      result = result.filter(b => b.available === true);
    }

    if (overdue === 'true') {
      const t = todayStart();
      result = result.filter(
        b => b.available === false && b.dueDate && new Date(b.dueDate) < t
      );
    }

    if (dueBefore) {
      const limit = new Date(dueBefore);
      if (!isNaN(limit)) {
        limit.setHours(23, 59, 59, 999);
        result = result.filter(b => b.dueDate && new Date(b.dueDate) <= limit);
      }
    }

    // Text search by multiple fields
    if (q && String(q).trim()) {
      const s = String(q).toLowerCase().trim();
      result = result.filter(b => {
        const fields = [
          b.title || '',
          b.author || '',
          b.borrower || '',
          b.dueDate || '',
          b.year != null ? String(b.year) : ''
        ];
        return fields.some(v => String(v).toLowerCase().includes(s));
      });
    }

    res.json(result);
  } catch (e) {
    next(e);
  }
});

app.get('/api/books/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const books = await readBooks();
    const book = books.find(b => b.id === id);
    if (!book) return res.status(404).json({ error: 'Not found' });
    res.json(book);
  } catch (e) {
    next(e);
  }
});

app.post('/api/books', async (req, res, next) => {
  try {
    const { title, author, year, coverUrl } = req.body;
    if (!title || !author) {
      return res.status(400).json({ error: 'Author and title are required' });
    }
    const y = year ? parseInt(year) : null;
    const books = await readBooks();
    const now = new Date().toISOString();
    const book = {
      id: nextId(books),
      title: String(title).trim(),
      author: String(author).trim(),
      year: Number.isInteger(y) ? y : null,
      coverUrl: coverUrl ? String(coverUrl) : '',
      available: true,
      borrower: null,
      dueDate: null,
      createdAt: now,
      updatedAt: now
    };
    books.push(book);
    await writeBooks(books);
    res.status(201).json(book);
  } catch (e) {
    next(e);
  }
});

app.put('/api/books/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { title, author, year, coverUrl } = req.body;
    const books = await readBooks();
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    if (title !== undefined) books[idx].title = String(title).trim();
    if (author !== undefined) books[idx].author = String(author).trim();
    if (year !== undefined) {
      const y = parseInt(year);
      books[idx].year = Number.isInteger(y) ? y : null;
    }
    if (coverUrl !== undefined) books[idx].coverUrl = String(coverUrl);

    books[idx].updatedAt = new Date().toISOString();
    await writeBooks(books);
    res.json(books[idx]);
  } catch (e) {
    next(e);
  }
});

app.delete('/api/books/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const books = await readBooks();
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const removed = books.splice(idx, 1)[0];
    await writeBooks(books);
    res.json({ ok: true, removed });
  } catch (e) {
    next(e);
  }
});

app.post('/api/books/:id/issue', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { borrower, dueDate } = req.body;
    if (!borrower || !dueDate) {
      return res.status(400).json({ error: 'Borrower and dueDate are required' });
    }
    const books = await readBooks();
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    if (!books[idx].available) {
      return res.status(400).json({ error: 'Book already issued' });
    }
    const dd = toIsoDateOnly(dueDate);
    if (!dd) return res.status(400).json({ error: 'Invalid dueDate' });

    books[idx].available = false;
    books[idx].borrower = String(borrower).trim();
    books[idx].dueDate = dd;
    books[idx].updatedAt = new Date().toISOString();
    await writeBooks(books);
    res.json(books[idx]);
  } catch (e) {
    next(e);
  }
});

app.post('/api/books/:id/return', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const books = await readBooks();
    const idx = books.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });

    books[idx].available = true;
    books[idx].borrower = null;
    books[idx].dueDate = null;
    books[idx].updatedAt = new Date().toISOString();
    await writeBooks(books);
    res.json(books[idx]);
  } catch (e) {
    next(e);
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.status(404).render('404', { title: 'Не найдено', message: 'Страница не найдена' });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api/')) {
    res.status(500).json({ error: 'Server error' });
  } else {
    res.status(500).render('500', { title: 'Ошибка', message: 'Внутренняя ошибка сервера' });
  }
});

app.listen(PORT, () => {
  console.log(`Library app is running on http://localhost:${PORT}`);
});
