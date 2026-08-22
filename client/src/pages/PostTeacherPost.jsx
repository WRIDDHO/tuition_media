import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getAllSubjects } from '@/services/studentService';
import { createTeacherPost } from '@/services/postService';

export default function PostTeacherPost() {
  const navigate = useNavigate();
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: getAllSubjects });
  const [form, setForm] = useState({
    subjectId: '', title: '', description: '', expectedSalary: '', duration: '',
    classLevel: '', location: '', mode: 'both', preferredGender: 'any',
    vacancy: 1, daysPerWeek: '', preferredTime: '', deadline: '',
  });
  const [saving, setSaving] = useState(false);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subjectId || !form.title) {
      toast.error('Subject and title are required.');
      return;
    }
    setSaving(true);
    try {
      const post = await createTeacherPost(form);
      toast.success('Post published!');
      navigate(`/teacher-posts/${post.post_id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to publish post');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold text-forest-950">Publish a Tuition Post</h1>
        <p className="mt-2 text-ink-600">Let students know you're available.</p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 rounded-3xl border border-forest-100 bg-cream-50 p-7 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Title</label>
            <input value={form.title} onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Experienced Math Tutor Available" className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
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
              placeholder="e.g. Class 9" className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Expected salary (৳/month)</label>
            <input type="number" value={form.expectedSalary} onChange={(e) => update('expectedSalary', e.target.value)}
              placeholder="6000" className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Location</label>
            <input value={form.location} onChange={(e) => update('location', e.target.value)}
              placeholder="e.g. Dhanmondi, Dhaka" className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Mode</label>
            <select value={form.mode} onChange={(e) => update('mode', e.target.value)}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700">
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Days per week</label>
            <input type="number" value={form.daysPerWeek} onChange={(e) => update('daysPerWeek', e.target.value)}
              placeholder="4" className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Preferred time</label>
            <input value={form.preferredTime} onChange={(e) => update('preferredTime', e.target.value)}
              placeholder="e.g. 7:00 PM" className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Description</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={4}
              placeholder="Tell students about your teaching style…" className="w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700" />
          </div>

          <button type="submit" disabled={saving}
            className="sm:col-span-2 mt-2 rounded-xl bg-forest-900 py-3 font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60">
            {saving ? 'Publishing…' : 'Publish post'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
