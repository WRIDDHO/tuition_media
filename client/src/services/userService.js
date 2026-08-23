import api from './api';

export async function getMyAccount() {
  const res = await api.get('/users/me');
  return res.data.user;
}

export async function updateMyAccount({ fullName }) {
  const res = await api.put('/users/me', { fullName });
  return res.data.user;
}

export async function uploadProfilePicture(formData) {
  const res = await api.put('/users/me/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.user;
}