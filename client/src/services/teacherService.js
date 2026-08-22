import api from './api';

export async function searchTeachers(filters = {}) {
  const res = await api.get('/teachers/search', { params: filters });
  return res.data.teachers;
}

export async function getTeacherById(id) {
  const res = await api.get(`/teachers/${id}`);
  return res.data.teacher;
}

export async function getMyTeacherProfile() {
  const res = await api.get('/teachers/me');
  return res.data.teacher;
}

export async function createTeacherProfile(data) {
  const res = await api.post('/teachers/me', data);
  return res.data.teacher;
}

export async function updateTeacherProfile(data) {
  const res = await api.put('/teachers/me', data);
  return res.data.teacher;
}
