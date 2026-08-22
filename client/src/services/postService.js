import api from './api';

// ---------- Teacher Posts ----------
export async function getAllTeacherPosts() {
  const res = await api.get('/teacher-posts');
  return res.data.posts;
}

export async function getTeacherPostById(id) {
  const res = await api.get(`/teacher-posts/${id}`);
  return res.data.post;
}

export async function getMyTeacherPosts() {
  const res = await api.get('/teacher-posts/mine');
  return res.data.posts;
}

export async function createTeacherPost(data) {
  const res = await api.post('/teacher-posts', data);
  return res.data.post;
}

export async function updateTeacherPost(id, data) {
  const res = await api.put(`/teacher-posts/${id}`, data);
  return res.data.post;
}

export async function deleteTeacherPost(id) {
  const res = await api.delete(`/teacher-posts/${id}`);
  return res.data;
}

// ---------- Student Requests ----------
export async function getAllStudentRequests() {
  const res = await api.get('/student-requests');
  return res.data.posts; // backend uses the "posts" key here too, see API reference
}

export async function getStudentRequestById(id) {
  const res = await api.get(`/student-requests/${id}`);
  return res.data.post;
}

export async function getMyStudentRequests() {
  const res = await api.get('/student-requests/mine');
  return res.data.posts;
}

export async function createStudentRequest(data) {
  const res = await api.post('/student-requests', data);
  return res.data.post;
}

export async function updateStudentRequest(id, data) {
  const res = await api.put(`/student-requests/${id}`, data);
  return res.data.post;
}

export async function deleteStudentRequest(id) {
  const res = await api.delete(`/student-requests/${id}`);
  return res.data;
}
