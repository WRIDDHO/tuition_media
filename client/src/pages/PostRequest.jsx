import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getAllSubjects } from '@/services/studentService';
import { createStudentRequest } from '@/services/postService';

const categories = ['Home Tuition', 'Online Tuition', 'Group Tuition', 'Admission Coaching'];

export default function PostRequest() {
  const navigate = useNavigate();
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: getAllSubjects });
  const [form, setForm] = useState({
    subjectId: '', classLevel: '', salary: '', description: '',
    location: '', categoryName: categories[0], daysPerWeek: '', preferredTime: '',
  });
  const [saving, setSaving] = useState(false);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subjectId || !form.classLevel) {
      toast.error('Subject and class level are required.');
      return;
    }
    setSaving(true);
    try {
      const req = await createStudentRequest(form);
      toast.success('Request posted!');
      navigate(`/requests/${req.request_id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post request');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold text-forest-950">Post a Request</h1>
        <p className="mt-2 text-ink-600">Tell tutors exactly what you need.</p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 rounded-3xl border border-forest-100 bg-cream-50 p-7 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Subject</label>
            <select value={form.subjectId} onChange={(e) => update('subjectId', e.target.value)}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700">
              <option value="">Select subject</option>
              {subjects?.map((s) => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Class level</label>
            <input value={form.classLevel} onChange={(e) => update('classLevel', e.target.value)}
              placeholder="e.g. Class 10" className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Category</label>
            <select value={form.categoryName} onChange={(e) => update('categoryName', e.target.value)}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Budget (৳/month)</label>
            <input type="number" value={form.salary} onChange={(e) => update('salary', e.target.value)}
              placeholder="6000" className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Location</label>
            <input value={form.location} onChange={(e) => update('location', e.target.value)}
              placeholder="e.g. Mirpur, Dhaka" className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Days per week</label>
            <input type="number" value={form.daysPerWeek} onChange={(e) => update('daysPerWeek', e.target.value)}
              placeholder="3" className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Description</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={4}
              placeholder="What exactly do you need help with?" className="w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700" />
          </div>

          <button type="submit" disabled={saving}
            className="sm:col-span-2 mt-2 rounded-xl bg-forest-900 py-3 font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60">
            {saving ? 'Posting…' : 'Post request'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
