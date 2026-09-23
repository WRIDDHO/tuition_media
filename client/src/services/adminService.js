import api from './api';

export async function getPlatformStats() {
  const res = await api.get('/admin/stats');
  return res.data.stats;
}

export async function getPendingTeachers() {
  const res = await api.get('/admin/teachers/pending');
  return res.data.teachers;
}

export async function getAllTeachers({ page = 1, limit = 20 } = {}) {
  const res = await api.get('/admin/teachers', { params: { page, limit } });
  return res.data; // { teachers, page, limit, totalCount }
}

export async function getTeacherDetail(userId) {
  const res = await api.get(`/admin/teachers/${userId}`);
  return res.data.teacher;
}

export async function approveTeacher(userId) {
  const res = await api.post(`/admin/teachers/${userId}/approve`);
  return res.data;
}

export async function rejectTeacher(userId, reason) {
  const res = await api.post(`/admin/teachers/${userId}/reject`, { reason });
  return res.data;
}

export async function getAllStudents({ page = 1, limit = 20 } = {}) {
  const res = await api.get('/admin/students', { params: { page, limit } });
  return res.data; // { students, page, limit, totalCount }
}

export async function suspendAccount(userId, reason) {
  const res = await api.post(`/admin/users/${userId}/suspend`, { reason });
  return res.data;
}

export async function activateAccount(userId, reason) {
  const res = await api.post(`/admin/users/${userId}/activate`, { reason });
  return res.data;
}

export async function deleteAccount(userId, reason) {
  const res = await api.delete(`/admin/users/${userId}`, { data: { reason } });
  return res.data;
}
export async function getAllMatches({ page = 1, limit = 20 } = {}) {
  const res = await api.get('/admin/matches', { params: { page, limit } });
  return res.data;
}
export async function getReportStats() {
  const res = await api.get('/admin/reports/stats');
  return res.data;
}

export async function getAllReports({ status } = {}) {
  const res = await api.get('/admin/reports', { params: status ? { status } : {} });
  return res.data.reports;
}

export async function getReportDetail(id) {
  const res = await api.get(`/admin/reports/${id}`);
  return res.data; // { report, evidence }
}

export async function reviewReport(id) {
  const res = await api.put(`/admin/reports/${id}/review`);
  return res.data;
}

export async function requestExplanation(id, deadlineHours) {
  const res = await api.put(`/admin/reports/${id}/request-explanation`, { deadlineHours });
  return res.data;
}

export async function resolveReport(id, { action, note, suspensionDays }) {
  const res = await api.put(`/admin/reports/${id}/resolve`, { action, note, suspensionDays });
  return res.data;
}