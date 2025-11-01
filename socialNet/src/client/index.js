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

function getUserIdFromPath() {
  const m = window.location.pathname.match(/^\/users\/([^\/]+)(?:\/|$)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// ---------- Users ----------
function userRowHtml(u) {
  const photo = u.photoUrl && u.photoUrl.trim() ? u.photoUrl : '/assets/media/placeholder.svg';
  const dateVal = u.birthdate || '';
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `
    <tr data-user-id="${esc(u.id)}">
      <td>
        <img class="photo" src="${esc(photo)}" alt="${esc(u.fullName)}" onerror="this.onerror=null;this.src='/assets/media/placeholder.svg';"/>
      </td>
      <td><input class="form-control" type="text" name="fullName" value="${esc(u.fullName)}"></td>
      <td><input class="form-control" type="date" name="birthdate" value="${esc(dateVal)}"></td>
      <td><input class="form-control" type="email" name="email" value="${esc(u.email)}"></td>
      <td><input class="form-control" type="text" name="photoUrl" value="${esc(u.photoUrl || '')}" placeholder=""></td>
      <td>
        <select class="form-select" data-role>
          <option value="user" ${u.role === 'user' ? 'selected' : ''}>Пользователь</option>
          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Администратор</option>
        </select>
      </td>
      <td>
        <select class="form-select" data-status>
          <option value="unconfirmed" ${u.status === 'unconfirmed' ? 'selected' : ''}>Не подтверждён</option>
          <option value="active" ${u.status === 'active' ? 'selected' : ''}>Активный</option>
          <option value="blocked" ${u.status === 'blocked' ? 'selected' : ''}>Заблокирован</option>
        </select>
      </td>
      <td class="d-flex gap-2">
        <a class="btn btn-sm btn-outline-secondary" href="/users/${esc(u.id)}">Редактировать</a>
        <a class="btn btn-sm btn-outline-primary" href="/users/${esc(u.id)}/friends">Друзья</a>
        <a class="btn btn-sm btn-outline-info" href="/users/${esc(u.id)}/news">Новости</a>
        <button class="btn btn-sm btn-success" type="button" data-save-user>Сохранить</button>
      </td>
    </tr>`;
}

async function renderUsersTable(users) {
  const tbody = document.querySelector('#users-tbody');
  const emptyEl = document.querySelector('#no-users');
  if (!tbody) return;
  if (!users || users.length === 0) {
    tbody.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('d-none');
    return;
  }
  if (emptyEl) emptyEl.classList.add('d-none');
  tbody.innerHTML = users.map(userRowHtml).join('');
}

async function loadUsers() {
  const table = document.querySelector('#users-table');
  if (!table) return;
  try {
    const users = await api('/api/users');
    await renderUsersTable(users);
  } catch (e) {
    console.error('Failed to load users', e);
  }
}

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
      form.reset();
      await loadUsers();
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
  const hint = document.querySelector('#user-edit-hint');
  const userId = getUserIdFromPath();
  if (!userId) {
    if (hint) hint.textContent = 'Не удалось определить пользователя из адреса URL';
    return;
  }
  form.dataset.userId = userId;

  // Загрузить данные пользователя и заполнить форму
  (async () => {
    try {
      const u = await api(`/api/users/${userId}`);
      form.querySelector('input[name="fullName"]').value = u.fullName || '';
      form.querySelector('input[name="email"]').value = u.email || '';
      form.querySelector('input[name="birthdate"]').value = u.birthdate || '';
      form.querySelector('input[name="photoUrl"]').value = u.photoUrl || '';
      const roleSel = form.querySelector('select[name="role"]');
      const statusSel = form.querySelector('select[name="status"]');
      if (roleSel) roleSel.value = u.role || 'user';
      if (statusSel) statusSel.value = u.status || 'unconfirmed';
      if (hint) hint.classList.add('d-none');
    } catch (err) {
      if (hint) {
        hint.classList.remove('text-muted');
        hint.classList.add('text-danger');
        hint.textContent = 'Пользователь не найден';
      }
    }
  })();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    await api(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Пользователь сохранён');
  });

  if (delButton) {
    delButton.addEventListener('click', async () => {
      if (!confirm('Вы уверены, что хотите удалить пользователя?')) return;
      await api(`/api/users/${userId}`, { method: 'DELETE' });
      showToast('Пользователь удалён');
      window.location.href = '/users';
    });
  }
}

// ---------- Friends ----------
function initFriendsPage() {
  const container = document.querySelector('#friends-list');
  if (!container) return;
  const userId = container.dataset.userId || getUserIdFromPath();
  if (!userId) return;

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
  if (!container) return;
  const userId = container.dataset.userId || getUserIdFromPath();
  if (!userId) return;

  const load = async () => {
    const news = await api(`/api/users/${userId}/news`);
    container.innerHTML = '';
    news.forEach((n) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-start';
      const left = document.createElement('div');
      left.className = 'me-2 flex-grow-1';
      const header = document.createElement('div');
      header.className = 'fw-bold';
      header.textContent = `${n.authorName} ${new Date(n.createdAt).toLocaleString()}`;
      const body = document.createElement('div');
      body.textContent = n.content;
      left.appendChild(header);
      left.appendChild(body);
      li.appendChild(left);
      if (n.authorId === userId) {
        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-sm btn-outline-danger';
        delBtn.setAttribute('data-delete-news', n.id);
        delBtn.textContent = 'Удалить';
        li.appendChild(delBtn);
      }
      container.appendChild(li);
    });
  };

  // удаление своих постов
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-delete-news]');
    if (btn) {
      const id = btn.getAttribute('data-delete-news');
      try {
        await api(`/api/news/${id}`, { method: 'DELETE' });
        showToast('Пост удалён');
        await load();
      } catch (err) {
        alert('Не удалось удалить пост: ' + err.message);
      }
    }
  });

  const form = document.querySelector('#news-create-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const authorId = userId;
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
  loadUsers();
});
