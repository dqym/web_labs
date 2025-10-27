async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

// ---------- Users ----------
function initUsersTable() {
  const table = document.querySelector('#users-table');
  if (!table) return;

  table.addEventListener('change', async (e) => {
    const row = e.target.closest('tr[data-user-id]');
    if (!row) return;
    const userId = row.dataset.userId;

    if (e.target.matches('select[data-role]')) {
      const role = e.target.value;
      await api(`/api/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
      showToast('Роль обновлена');
    }
    if (e.target.matches('select[data-status]')) {
      const status = e.target.value;
      await api(`/api/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      showToast('Статус обновлён');
    }
  });

  table.addEventListener('click', async (e) => {
    const btnSave = e.target.closest('button[data-save-user]');
    if (btnSave) {
      const row = btnSave.closest('tr[data-user-id]');
      const userId = row.dataset.userId;
      const fullName = row.querySelector('input[name="fullName"]').value.trim();
      const email = row.querySelector('input[name="email"]').value.trim();
      const birthdate = row.querySelector('input[name="birthdate"]').value.trim();
      const photoUrl = row.querySelector('input[name="photoUrl"]').value.trim();
      const payload = { fullName, email, birthdate, photoUrl };
      await api(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Пользователь сохранён');
    }
  });
}

function initCreateUserForm() {
  const form = document.querySelector('#create-user-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    try {
      await api('/api/users', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Пользователь создан');
      window.location.reload();
    } catch (err) {
      alert('Ошибка создания: ' + err.message);
    }
  });
}

// ---------- User edit ----------
function initUserEditForm() {
    const form = document.querySelector('#user-edit-form');
    if (!form) return;
  const delButton = form.querySelector('[data-delete-user]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = form.dataset.userId;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    await api(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Пользователь сохранён');
  });

  if (delButton) {
    delButton.addEventListener('click', async () => {
      const userId = form.dataset.userId;
      if (!confirm("Вы уверены, что хотите удалить пользователя?")) return;
      await api(`/api/users/${userId}`, { method: 'DELETE' });
      showToast("Пользователь удалён");
      window.location.href = '/users';
    });
  }
}

// ---------- Friends ----------
function initFriendsPage() {
  const container = document.querySelector('#friends-list');
  const userId = container?.dataset.userId;
  if (!container || !userId) return;

  const select = document.querySelector('#add-friend-select');
  const btnAdd = document.querySelector('#add-friend-button');

  const load = async () => {
    const [friends, allUsers] = await Promise.all([api(`/api/users/${userId}/friends`), api('/api/users')]);
    // Рендер списка друзей
    container.innerHTML = '';
    friends.forEach((u) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `
        <span>${u.fullName} <small class="text-muted">&lt;${u.email}&gt;</small></span>
        <button class="btn btn-sm btn-outline-danger" data-remove="${u.id}">Удалить</button>`;
      container.appendChild(li);
    });

    // Заполнить select доступными для добавления
    if (select) {
      const friendIds = new Set(friends.map((u) => u.id));
      const options = ['<option value="">Выберите пользователя для добавления в друзья</option>'].concat(
        allUsers
          .filter((u) => u.id !== userId && !friendIds.has(u.id))
          .map((u) => `<option value="${u.id}">${u.fullName} &lt;${u.email}&gt;</option>`)
      );
      select.innerHTML = options.join('');
    }
  };

  container.addEventListener('click', async (e) => {
    const fid = e.target.closest('button[data-remove]')?.dataset.remove;
    if (fid) {
      await api(`/api/users/${userId}/friends/${fid}`, { method: 'DELETE' });
      await load();
      showToast('Друг удалён');
    }
  });

  if (btnAdd && select) {
    btnAdd.addEventListener('click', async () => {
      const friendId = select.value;
      if (!friendId) return;
      await api(`/api/users/${userId}/friends`, { method: 'POST', body: JSON.stringify({ friendId }) });
      await load();
      showToast('Друг добавлен');
    });
  }

  load().catch(console.error);
}

// ---------- News ----------
function initNewsPage() {
  const container = document.querySelector('#news-list');
  const userId = container?.dataset.userId;
  if (!container || !userId) return;

  const load = async () => {
    const news = await api(`/api/users/${userId}/news`);
    container.innerHTML = '';
    news.forEach((n) => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.innerHTML = `<div class="fw-bold">${n.authorName} ${new Date(n.createdAt).toLocaleString()}</div><div>${n.content}</div>`;
      container.appendChild(li);
    });
  };

  const form = document.querySelector('#news-create-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const authorId = form.dataset.userId;
      const content = form.querySelector('textarea[name="content"]').value.trim();
      if (!content) return;
      await api('/api/news', { method: 'POST', body: JSON.stringify({ authorId, content }) });
      showToast('Пост опубликован');
      form.reset();
      // лента друзей может не включать свои посты; просто перезагрузим ленту
      await load();
    });
  }

  load().catch(console.error);
}

// ---------- UI ----------
function showToast(message) {
  const el = document.createElement('div');
  el.className = 'toast align-items-center text-bg-primary border-0 position-fixed bottom-0 end-0 m-3';
  el.setAttribute('role', 'alert');
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div>`;
  document.body.appendChild(el);
  const toast = new window.bootstrap.Toast(el, { delay: 1500 });
  toast.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

document.addEventListener('DOMContentLoaded', () => {
  initUsersTable();
  initCreateUserForm();
  initUserEditForm();
  initFriendsPage();
  initNewsPage();
});
