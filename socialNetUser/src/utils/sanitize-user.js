function sanitizeUser(user) {
  if (!user) {
    return null;
  }
  const { password, ...safeUser } = user;
  return safeUser;
}

function sanitizeUsers(users = []) {
  return users.map((user) => sanitizeUser(user)).filter(Boolean);
}

module.exports = {
  sanitizeUser,
  sanitizeUsers
};
