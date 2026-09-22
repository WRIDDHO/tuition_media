import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getAllSubjects } from '@/services/studentService';
import { createTeacherPost, getTeacherPostById, updateTeacherPost } from '@/services/postService';
import { Spinner } from '@/components/shared/Primitives';

const EMPTY_FORM = {
  subjectId: '', title: '', description: '', expectedSalary: '', duration: '',
  classLevel: '', location: '', mode: 'both', preferredGender: 'any',
  vacancy: 1, daysPerWeek: '', preferredTime: '', deadline: '',
};

export default function PostTeacherPost() {
  const navigate = useNavigate();
  const { id } = useParams(); // present only on /teacher-posts/:id/edit
  const isEditing = !!id;

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: getAllSubjects });
  const { data: existingPost, isLoading: loadingPost } = useQuery({
    queryKey: ['teacher-post', id],
    queryFn: () => getTeacherPostById(id),
    enabled: isEditing,
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Prefill the form once the existing post loads (edit mode only).
  useEffect(() => {
    if (!existingPost) return;
    setForm({
      subjectId: existingPost.subject_id ?? '',
      title: existingPost.title ?? '',
      description: existingPost.description ?? '',
      expectedSalary: existingPost.expected_salary ?? '',
      duration: existingPost.duration ?? '',
      classLevel: existingPost.class_level ?? '',
      location: existingPost.location ?? '',
      mode: existingPost.mode ?? 'both',
      preferredGender: existingPost.preferred_gender ?? 'any',
      vacancy: existingPost.vacancy ?? 1,
      daysPerWeek: existingPost.days_per_week ?? '',
      preferredTime: existingPost.preferred_time ?? '',
      deadline: existingPost.deadline ? String(existingPost.deadline).slice(0, 10) : '',
    });
  }, [existingPost]);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subjectId || !form.title) {
      toast.error('Subject and title are required.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        // status is preserved as-is by the backend when omitted; send it
        // through so an edit never accidentally resets it.
        await updateTeacherPost(id, { ...form, status: existingPost?.status });
        toast.success('Post updated!');
        navigate(`/teacher-posts/${id}`);
      } else {
        const post = await createTeacherPost(form);
        toast.success('Post published!');
        navigate(`/teacher-posts/${post.post_id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || (isEditing ? 'Failed to update post' : 'Failed to publish post'));
    } finally {
      setSaving(false);
    }
  }

  if (isEditing && loadingPost) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold text-forest-950">
          {isEditing ? 'Edit Tuition Post' : 'Publish a Tuition Post'}
        </h1>
        <p className="mt-2 text-ink-600">
          {isEditing ? 'Update the details students see.' : "Let students know you're available."}
        </p>

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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Session duration</label>
            <input value={form.duration} onChange={(e) => update('duration', e.target.value)}
              placeholder="e.g. 1.5 Hour" className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Vacancy (how many students)</label>
            <input type="number" min="1" value={form.vacancy} onChange={(e) => update('vacancy', e.target.value)}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Preferred student gender</label>
            <select value={form.preferredGender} onChange={(e) => update('preferredGender', e.target.value)}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700">
              <option value="any">No preference</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Application deadline</label>
            <input type="date" value={form.deadline} onChange={(e) => update('deadline', e.target.value)}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Description</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={4}
              placeholder="Tell students about your teaching style…" className="w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700" />
          </div>

          <button type="submit" disabled={saving}
            className="sm:col-span-2 mt-2 rounded-xl bg-forest-900 py-3 font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60">
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Publish post'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
