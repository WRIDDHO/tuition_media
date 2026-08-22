
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getMyStudentProfile, createStudentProfile, updateStudentProfile } from '@/services/studentService';

const emptyForm = { educationLevel: '', institution: '', medium: '', bio: '', phone: '', district: '', area: '' };

export default function StudentProfileSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyStudentProfile()
      .then((data) => {
        setForm({
          educationLevel: data.education_level || '', institution: data.institution || '',
          medium: data.medium || '', bio: data.bio || '', phone: data.phone || '',
          district: data.district || '', area: data.area || '',
        });
        setExists(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (exists) {
        await updateStudentProfile(form);
        toast.success('Profile updated');
      } else {
        await createStudentProfile(form);
        toast.success('Profile created');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  const fields = [
    { key: 'educationLevel', label: 'Class / Education level', placeholder: 'e.g. Class 10' },
    { key: 'institution', label: 'Institution', placeholder: 'e.g. Dhaka Residential Model College' },
    { key: 'district', label: 'District', placeholder: 'e.g. Dhaka' },
    { key: 'area', label: 'Area', placeholder: 'e.g. Mirpur' },
    { key: 'phone', label: 'Phone', placeholder: '017XXXXXXXX' },
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold text-forest-950">
          {exists ? 'Edit your profile' : 'Complete your student profile'}
        </h1>
        <p className="mt-2 text-ink-600">This helps tutors understand what you need.</p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 rounded-3xl border border-forest-100 bg-cream-50 p-7 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-sm font-medium text-ink-900">{f.label}</label>
              <input
                value={form[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
              />
            </div>
          ))}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Medium</label>
            <select
              value={form.medium}
              onChange={(e) => update('medium', e.target.value)}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
            >
              <option value="">Select</option>
              <option value="Bangla">Bangla Medium</option>
              <option value="English">English Medium</option>
              <option value="English Version">English Version</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              rows={3}
              placeholder="A little about what you're looking for…"
              className="w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="sm:col-span-2 mt-2 rounded-xl bg-forest-900 py-3 font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
          >
            {saving ? 'Saving…' : exists ? 'Save changes' : 'Create profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
