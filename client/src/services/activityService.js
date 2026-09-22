import api from './api';

// ---------- Applications (student -> teacher's post direction only) ----------
export async function applyToPost(postId) {
  const res = await api.post('/applications/posts/apply', { postId });
  return res.data.application;
}

export async function getMyPostApplications() {
  const res = await api.get('/applications/posts/mine');
  return res.data.applications;
}

export async function getApplicationsForPost(postId) {
  const res = await api.get(`/applications/posts/${postId}`);
  return res.data.applications;
}

export async function acceptApplication(applicationId) {
  const res = await api.put(`/applications/posts/${applicationId}/accept`);
  return res.data; // { message, matchId }
}

export async function rejectApplication(applicationId) {
  const res = await api.put(`/applications/posts/${applicationId}/reject`);
  return res.data;
}

export async function withdrawApplication(applicationId) {
  const res = await api.delete(`/applications/posts/${applicationId}`);
  return res.data;
}

// ---------- Applications (teacher -> student's request direction) ----------
export async function applyToRequest(requestId) {
  const res = await api.post('/applications/requests/apply', { requestId });
  return res.data.application;
}

export async function getMyRequestApplications() {
  const res = await api.get('/applications/requests/mine');
  return res.data.applications;
}

export async function getApplicationsForRequest(requestId) {
  const res = await api.get(`/applications/requests/${requestId}`);
  return res.data.applications;
}

export async function acceptRequestApplication(applicationId) {
  const res = await api.put(`/applications/requests/${applicationId}/accept`);
  return res.data; // { message, matchId }
}

export async function rejectRequestApplication(applicationId) {
  const res = await api.put(`/applications/requests/${applicationId}/reject`);
  return res.data;
}

export async function withdrawRequestApplication(applicationId) {
  const res = await api.delete(`/applications/requests/${applicationId}`);
  return res.data;
}

// ---------- Questions & Answers ----------
export async function getAllQuestions(subjectId) {
  const res = await api.get('/questions', { params: subjectId ? { subjectId } : {} });
  return res.data.questions;
}

export async function getQuestionById(id) {
  const res = await api.get(`/questions/${id}`);
  return res.data.question; // includes nested "answers" array
}

export async function createQuestion(formData) {
  // formData must be a real FormData object (subjectId, title, body, image?)
  const res = await api.post('/questions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.question;
}

export async function createAnswer(questionId, formData) {
  const res = await api.post(`/answers/${questionId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.answer;
}

export async function acceptAnswer(answerId) {
  const res = await api.put(`/answers/${answerId}/accept`);
  return res.data.answer;
}

export async function updateQuestion(id, data) {
  const res = await api.put(`/questions/${id}`, data);
  return res.data.question;
}

export async function deleteQuestion(id) {
  const res = await api.delete(`/questions/${id}`);
  return res.data;
}

export async function updateAnswer(answerId, data) {
  const res = await api.put(`/answers/${answerId}`, data);
  return res.data.answer;
}

export async function deleteAnswer(answerId) {
  const res = await api.delete(`/answers/${answerId}`);
  return res.data;
}

// ---------- Resources ----------
export async function getAllResources(subjectId) {
  const res = await api.get('/resources', { params: subjectId ? { subjectId } : {} });
  return res.data.resources;
}

export async function getMyResources() {
  const res = await api.get('/resources/mine');
  return res.data.resources;
}

export async function uploadResource(formData) {
  const res = await api.post('/resources', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.resource;
}

export async function updateResource(id, data) {
  const res = await api.put(`/resources/${id}`, data);
  return res.data.resource;
}

export async function deleteResource(id) {
  const res = await api.delete(`/resources/${id}`);
  return res.data;
}

export function getResourceDownloadUrl(id) {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return `${base}/resources/${id}/download`;
}

// ---------- Bookmarks (resources only) ----------
export async function toggleBookmark(resourceId) {
  const res = await api.post(`/bookmarks/${resourceId}/toggle`);
  return res.data; // { message, bookmarked }
}

export async function getMyBookmarks() {
  const res = await api.get('/bookmarks');
  return res.data.bookmarks;
}

// ---------- Notifications ----------
export async function getMyNotifications() {
  const res = await api.get('/notifications');
  return res.data.notifications;
}

export async function getUnreadNotificationCount() {
  const res = await api.get('/notifications/unread-count');
  return res.data.unread_count;
}

export async function markNotificationRead(id) {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data.notification;
}

export async function markAllNotificationsRead() {
  const res = await api.put('/notifications/read-all');
  return res.data;
}
export async function getAllMatches({ page = 1, limit = 20 } = {}) {
  const res = await api.get('/admin/matches', { params: { page, limit } });
  return res.data;
}