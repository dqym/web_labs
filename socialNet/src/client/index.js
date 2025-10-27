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

function initUserEditForm() {
  const form = document.querySelector('#user-edit-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = form.dataset.userId;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    await api(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Пользователь сохранён');
  });
}

function initFriendsPage() {
  const container = document.querySelector('#friends-list');
  const userId = container?.dataset.userId;
  if (!container || !userId) return;

  const load = async () => {
    const friends = await api(`/api/users/${userId}/friends`);
    container.innerHTML = '';
    friends.forEach((u) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `
        <span>${u.fullName} <small class="text-muted">&lt;${u.email}&gt;</small></span>
        <button class="btn btn-sm btn-outline-danger" data-remove="${u.id}">Удалить</button>`;
      container.appendChild(li);
    });
  };

  container.addEventListener('click', async (e) => {
    const fid = e.target.closest('button[data-remove]')?.dataset.remove;
    if (fid) {
      await api(`/api/users/${userId}/friends/${fid}`, { method: 'DELETE' });
      await load();
      showToast('Друг удалён');
    }
  });

  load().catch(console.error);
}

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
      li.innerHTML = `<div class="fw-bold">${new Date(n.createdAt).toLocaleString()}</div><div>${n.content}</div>`;
      container.appendChild(li);
    });
  };

  load().catch(console.error);
}

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
  initUserEditForm();
  initFriendsPage();
  initNewsPage();
});
