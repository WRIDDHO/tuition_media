import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getMyTeacherProfile, createTeacherProfile, updateTeacherProfile } from '@/services/teacherService';

const emptyForm = {
  qualification: '', institution: '', currentLevel: '', major: '',
  experienceYears: '', gender: '', hourlyRate: '', district: '', area: '', phone: '',
};

export default function TeacherProfileSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyTeacherProfile()
      .then((data) => {
        setForm({
          qualification: data.qualification || '', institution: data.institution || '',
          currentLevel: data.current_level || '', major: data.major || '',
          experienceYears: data.experience_years || '', gender: data.gender || '',
          hourlyRate: data.hourly_rate || '', district: data.district || '',
          area: data.area || '', phone: data.phone || '',
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
        await updateTeacherProfile(form);
        toast.success('Profile updated');
      } else {
        await createTeacherProfile(form);
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
    { key: 'qualification', label: 'Qualification', placeholder: 'e.g. MSc in Mathematics' },
    { key: 'institution', label: 'Institution', placeholder: 'e.g. Dhaka University' },
    { key: 'currentLevel', label: 'Current position', placeholder: 'e.g. Lecturer' },
    { key: 'major', label: 'Major', placeholder: 'e.g. Mathematics' },
    { key: 'experienceYears', label: 'Years of experience', type: 'number', placeholder: '5' },
    { key: 'hourlyRate', label: 'Hourly rate (৳)', type: 'number', placeholder: '500' },
    { key: 'district', label: 'District', placeholder: 'e.g. Dhaka' },
    { key: 'area', label: 'Area', placeholder: 'e.g. Dhanmondi' },
    { key: 'phone', label: 'Phone', placeholder: '017XXXXXXXX' },
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold text-forest-950">
          {exists ? 'Edit your profile' : 'Complete your teacher profile'}
        </h1>
        <p className="mt-2 text-ink-600">This is what students will see on your public profile.</p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 rounded-3xl border border-forest-100 bg-cream-50 p-7 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className={f.key === 'qualification' ? 'sm:col-span-2' : ''}>
              <label className="mb-1.5 block text-sm font-medium text-ink-900">{f.label}</label>
              <input
                type={f.type || 'text'}
                value={form[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
              />
            </div>
          ))}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => update('gender', e.target.value)}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
            >
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
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
