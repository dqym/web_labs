(function () {
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function el(name, props = {}, children = []) {
    const e = document.createElement(name);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'class') e.className = v;
      else if (k.startsWith('data-')) e.setAttribute(k, v);
      else if (k === 'text') e.textContent = v;
      else e[k] = v;
    });
    children.forEach(c => e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return e;
  }

  function fmtStatus(book) {
    if (book.available) return '<span class="w3-tag w3-green">В наличии</span>';
    const overdue = book.dueDate && new Date(book.dueDate) < new Date(new Date().setHours(0,0,0,0));
    return `<span class="w3-tag ${overdue ? 'w3-red' : 'w3-orange'}">Выдана</span>`;
    }

  // Формат даты: dd.mm.yyyy (без сдвига по таймзоне для ISO yyyy-mm-dd)
  function fmtDate(value) {
    if (!value) return '';
    const s = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-');
      return `${d}.${m}.${y}`;
    }
    const dt = new Date(s);
    if (isNaN(dt)) return s;
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yy = dt.getFullYear();
    return `${dd}.${mm}.${yy}`;
  }

  function coverCell(book) {
    const src = (book.coverUrl && String(book.coverUrl).trim()) || '/img/placeholder-cover.svg';
    const alt = `Обложка: ${book.title || ''}`.replace(/"/g, '&quot;');
    return `<img class="cover-thumb" src="${src}" alt="${alt}" onerror="this.src='/img/placeholder-cover.svg';this.onerror=null">`;
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function renderRow(book) {
    const tr = el('tr', { 'data-id': book.id });
    tr.innerHTML = `
      <td class="cover-cell">${coverCell(book)}</td>
      <td>${book.author || ''}</td>
      <td>${book.title || ''}</td>
      <td>${book.year ?? ''}</td>
      <td>${fmtStatus(book)}</td>
      <td>${book.borrower ?? ''}</td>
      <td>${fmtDate(book.dueDate)}</td>
      <td>
        <a class="w3-button w3-small w3-teal" href="/books/${book.id}" title="Открыть карточку">
          <i class="fa-regular fa-pen-to-square"></i>
        </a>
        <button class="w3-button w3-small w3-red delete-book" type="button" data-id="${book.id}" title="Удалить">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </td>
    `;
    return tr;
  }

  async function loadBooks(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch('/api/books?' + query.toString());
    if (!res.ok) throw new Error('Failed to load books');
    return res.json();
  }

  function setupListPage() {
    const tbody = qs('#booksTableBody');
    if (!tbody) return;

    const state = {
      books: Array.isArray(window.__INITIAL_BOOKS__) ? window.__INITIAL_BOOKS__ : []
    };

    function repaint() {
      tbody.innerHTML = '';
      state.books.forEach(b => tbody.appendChild(renderRow(b)));
    }

    repaint();

    // Filters + Search
    const inputSearch = qs('#searchQuery');
    const cbAvailable = qs('#filterAvailable');
    const cbOverdue = qs('#filterOverdue');
    const inputDueBefore = qs('#filterDueBefore');
    const btnApply = qs('#applyFilters');
    const btnReset = qs('#resetFilters');

    async function applyFilters() {
      const params = {};
      const q = inputSearch?.value?.trim();
      if (q) params.q = q;
      if (cbAvailable?.checked) params.available = 'true';
      if (cbOverdue?.checked) params.overdue = 'true';
      if (inputDueBefore?.value) params.dueBefore = inputDueBefore.value;
      state.books = await loadBooks(params);
      repaint();
    }

    btnApply?.addEventListener('click', applyFilters);

    btnReset?.addEventListener('click', async () => {
      if (inputSearch) inputSearch.value = '';
      if (cbAvailable) cbAvailable.checked = false;
      if (cbOverdue) cbOverdue.checked = false;
      if (inputDueBefore) inputDueBefore.value = '';
      state.books = await loadBooks({});
      repaint();
    });

    // Live search with debounce
    inputSearch?.addEventListener('input', debounce(applyFilters, 300));
    inputSearch?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyFilters();
      }
    });

    // Delete with confirmation (event delegation)
    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('.delete-book');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      if (!id) return;
      if (!confirm('Удалить книгу?')) return;
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // remove row
        const tr = btn.closest('tr');
        tr?.remove();
      } else {
        alert('Не удалось удалить книгу');
      }
    });

    // Add dialog
    const dlg = qs('#addBookDialog');
    const openBtn = qs('#openAddDialog');
    const cancelBtn = qs('#cancelAdd');
    const form = qs('#addBookForm');

    openBtn?.addEventListener('click', () => dlg?.showModal());
    cancelBtn?.addEventListener('click', () => dlg?.close());
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = {
        author: fd.get('author'),
        title: fd.get('title'),
        year: fd.get('year'),
        coverUrl: fd.get('coverUrl')
      };
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        tbody.prepend(renderRow(created));
        form.reset();
        dlg.close();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Ошибка: ' + (err.error || 'не удалось добавить'));
      }
    });
  }

  function setupShowPage() {
    const book = window.__BOOK__;
    if (!book) return;

    const form = qs('#bookForm');
    const saveBtn = qs('#saveBook');
    const issueBtn = qs('#issueBtn');
    const returnBtn = qs('#returnBtn');
    const deleteLink = qs('#warnDelete');
    const issueDlg = qs('#issueDialog');
    const issueForm = qs('#issueForm');
    const cancelIssue = qs('#cancelIssue');

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = {
        author: fd.get('author'),
        title: fd.get('title'),
        year: fd.get('year'),
        coverUrl: fd.get('coverUrl')
      };
      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Сохранено');
        location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Ошибка: ' + (err.error || 'не удалось сохранить'));
      }
    });

    issueBtn?.addEventListener('click', () => issueDlg?.showModal());
    cancelIssue?.addEventListener('click', () => issueDlg?.close());
    issueForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(issueForm);
      const payload = { borrower: fd.get('borrower'), dueDate: fd.get('dueDate') };
      const res = await fetch(`/api/books/${book.id}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Книга выдана');
        location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Ошибка: ' + (err.error || 'не удалось выдать'));
      }
    });

    returnBtn?.addEventListener('click', async () => {
      if (!confirm('Принять книгу обратно?')) return;
      const res = await fetch(`/api/books/${book.id}/return`, { method: 'POST' });
      if (res.ok) {
        alert('Книга возвращена');
        location.reload();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Ошибка: ' + (err.error || 'не удалось вернуть'));
      }
    });

    deleteLink?.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!confirm('Удалить книгу?')) return;
      const id = deleteLink.getAttribute('data-id');
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      if (res.ok) {
        location.href = '/books';
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Ошибка: ' + (err.error || 'не удалось удалить'));
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupListPage();
    setupShowPage();
  });
})();
