import api from './api';

export const REPORT_REASONS = [
  { value: 'misbehavior', label: 'Misbehavior' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate_communication', label: 'Inappropriate communication' },
  { value: 'fake_information', label: 'Fake information' },
  { value: 'payment_issue', label: 'Payment issue' },
  { value: 'failure_to_attend', label: 'Failure to attend tuition' },
  { value: 'repeated_cancellation', label: 'Repeated cancellation' },
  { value: 'academic_misconduct', label: 'Academic misconduct' },
  { value: 'fraud_scam', label: 'Fraud / scam' },
  { value: 'agreement_violation', label: 'Agreement violation' },
  { value: 'other', label: 'Other' },
];

export async function createReport({ matchId, reason, description, evidenceFiles }) {
  const fd = new FormData();
  fd.append('matchId', matchId);
  fd.append('reason', reason);
  fd.append('description', description);
  (evidenceFiles || []).forEach((f) => fd.append('evidence', f));
  const res = await api.post('/reports', fd);
  return res.data;
}

export async function getMyReports() {
  const res = await api.get('/reports/mine');
  return res.data.reports;
}

export async function getReportsAboutMe() {
  const res = await api.get('/reports/about-me');
  return res.data.reports;
}

export async function getReportById(id) {
  const res = await api.get(`/reports/${id}`);
  return res.data; // { report, evidence }
}

export async function submitExplanation(id, { explanation, evidenceFiles }) {
  const fd = new FormData();
  fd.append('explanation', explanation);
  (evidenceFiles || []).forEach((f) => fd.append('evidence', f));
  const res = await api.put(`/reports/${id}/explain`, fd);
  return res.data;
}