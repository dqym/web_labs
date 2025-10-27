export function validateUser(u) {
  const errors = [];
  if (!u || typeof u !== 'object') {
    return [false, ['payload must be an object']];
  }
  if (!u.fullName || String(u.fullName).trim().length < 3) {
    errors.push('fullName must be at least 3 chars');
  }
  if (!u.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(u.email))) {
    errors.push('email is invalid');
  }
  if (u.role && !['user', 'admin'].includes(u.role)) {
    errors.push('role is invalid');
  }
  if (u.status && !['unconfirmed', 'active', 'blocked'].includes(u.status)) {
    errors.push('status is invalid');
  }
  return [errors.length === 0, errors];
}
