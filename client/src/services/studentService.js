import api from './api';

// ---------- Subjects ----------
export async function getAllSubjects() {
  const res = await api.get('/subjects');
  return res.data.subjects;
}

export async function createSubject(data) {
  const res = await api.post('/subjects', data);
  return res.data.subject;
}

// ---------- Student profile ----------
export async function getMyStudentProfile() {
  const res = await api.get('/students/me');
  return res.data.student;
}

export async function createStudentProfile(data) {
  const res = await api.post('/students/me', data);
  return res.data.student;
}

export async function updateStudentProfile(data) {
  const res = await api.put('/students/me', data);
  return res.data.student;
}

// ---------- Reviews ----------
export async function getReviewsForTeacher(teacherId) {
  const res = await api.get(`/reviews/teacher/${teacherId}`);
  return res.data; // { avgRating, totalReviews, reviews }
}

export async function submitReview({ matchId, rating, comment }) {
  const res = await api.post('/reviews', { matchId, rating, comment });
  return res.data.review;
}

export async function updateReview(id, { rating, comment }) {
  const res = await api.put(`/reviews/${id}`, { rating, comment });
  return res.data.review;
}

export async function deleteReview(id) {
  const res = await api.delete(`/reviews/${id}`);
  return res.data;
}
