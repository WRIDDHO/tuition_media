import api from './api';

export async function getMyMatches() {
  const res = await api.get('/matches/mine');
  return res.data.matches;
}

export async function getMatchById(id) {
  const res = await api.get(`/matches/${id}`);
  return res.data.match;
}

export async function cancelMatch(id, reason) {
  const res = await api.put(`/matches/${id}/cancel`, { reason });
  return res.data;
}