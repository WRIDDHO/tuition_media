import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getAllSubjects } from '@/services/studentService';
import { createStudentRequest, getStudentRequestById, updateStudentRequest } from '@/services/postService';
import { Spinner } from '@/components/shared/Primitives';

const categories = ['Home Tuition', 'Online Tuition', 'Group Tuition', 'Admission Coaching'];

const EMPTY_FORM = {
  subjectId: '', classLevel: '', salary: '', description: '',
  location: '', categoryName: categories[0], daysPerWeek: '', preferredTime: '',
  mode: 'both', preferredInstitution: '',
};

export default function PostRequest() {
  const navigate = useNavigate();
  const { id } = useParams(); // present only on /requests/:id/edit
  const isEditing = !!id;

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: getAllSubjects });
  const { data: existingRequest, isLoading: loadingRequest } = useQuery({
    queryKey: ['request', id],
    queryFn: () => getStudentRequestById(id),
    enabled: isEditing,
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existingRequest) return;
    setForm({
      subjectId: existingRequest.subject_id ?? '',
      classLevel: existingRequest.class_level ?? '',
      salary: existingRequest.salary ?? '',
      description: existingRequest.description ?? '',
      location: existingRequest.location ?? '',
      categoryName: existingRequest.category_name ?? categories[0],
      daysPerWeek: existingRequest.days_per_week ?? '',
      preferredTime: existingRequest.preferred_time ?? '',
      mode: existingRequest.mode ?? 'both',
      preferredInstitution: existingRequest.preferred_institution ?? '',
    });
  }, [existingRequest]);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subjectId || !form.classLevel) {
      toast.error('Subject and class level are required.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await updateStudentRequest(id, { ...form, status: existingRequest?.status });
        toast.success('Request updated!');
        navigate(`/requests/${id}`);
      } else {
        const req = await createStudentRequest(form);
        toast.success('Request posted!');
        navigate(`/requests/${req.request_id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || (isEditing ? 'Failed to update request' : 'Failed to post request'));
    } finally {
      setSaving(false);
    }
  }

  if (isEditing && loadingRequest) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold text-forest-950">
          {isEditing ? 'Edit Request' : 'Post a Request'}
        </h1>
        <p className="mt-2 text-ink-600">
          {isEditing ? 'Update what tutors will see.' : 'Tell tutors exactly what you need.'}
        </p>

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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Preferred time</label>
            <input value={form.preferredTime} onChange={(e) => update('preferredTime', e.target.value)}
              placeholder="e.g. 6:00 PM" className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
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
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Preferred institution (optional)</label>
            <input value={form.preferredInstitution} onChange={(e) => update('preferredInstitution', e.target.value)}
              placeholder="e.g. Public University tutor preferred" className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Description</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={4}
              placeholder="What exactly do you need help with?" className="w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700" />
          </div>

          <button type="submit" disabled={saving}
            className="sm:col-span-2 mt-2 rounded-xl bg-forest-900 py-3 font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60">
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Post request'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
