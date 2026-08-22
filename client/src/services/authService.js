import api from './api';

export async function registerUser({ fullName, email, password, role }) {
  const res = await api.post('/auth/register', { fullName, email, password, role });
  return res.data;
}

export async function loginUser({ email, password }) {
  const res = await api.post('/auth/login', { email, password });
  return res.data; // { message, token, user: { userId, fullName, email, role } }
}
