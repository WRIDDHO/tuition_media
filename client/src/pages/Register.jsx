import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PasswordInput from '@/components/shared/PasswordInput';

const TEACHER_FIELDS = [
  { key: 'qualification', label: 'Qualification', placeholder: 'e.g. MSc in Mathematics', span: true },
  { key: 'institution', label: 'Institution', placeholder: 'e.g. Dhaka University' },
  { key: 'currentLevel', label: 'Current position', placeholder: 'e.g. Lecturer' },
  { key: 'major', label: 'Major', placeholder: 'e.g. Mathematics' },
  { key: 'experienceYears', label: 'Years of experience', type: 'number', placeholder: '5' },
  { key: 'district', label: 'District', placeholder: 'e.g. Dhaka' },
  { key: 'area', label: 'Area', placeholder: 'e.g. Dhanmondi' },
  { key: 'phone', label: 'Phone', placeholder: '01XXXXXXXXX' },
];

const STUDENT_FIELDS = [
  { key: 'educationLevel', label: 'Class / Education level', placeholder: 'e.g. Class 10' },
  { key: 'institution', label: 'Institution', placeholder: 'e.g. Dhaka Residential Model College' },
  { key: 'district', label: 'District', placeholder: 'e.g. Dhaka' },
  { key: 'area', label: 'Area', placeholder: 'e.g. Mirpur' },
  { key: 'phone', label: 'Phone', placeholder: '01XXXXXXXXX' },
];

const emptyProfile = {
  qualification: '', institution: '', currentLevel: '', major: '', experienceYears: '',
  gender: '', district: '', area: '', phone: '', educationLevel: '', medium: '',
};

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState(emptyProfile);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldsForRole = role === 'teacher' ? TEACHER_FIELDS : STUDENT_FIELDS;

  function updateProfile(key, value) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function validate() {
    const next = {};
    if (fullName.trim().length < 2) next.fullName = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address';
    if (password.length < 6) next.password = 'Password must be at least 6 characters';

    for (const f of fieldsForRole) {
      if (!String(profile[f.key] ?? '').trim()) next[f.key] = `${f.label} is required`;
    }
    if (role === 'teacher') {
      if (!profile.gender) next.gender = 'Select a gender';
      if (profile.phone && !/^\d{11}$/.test(profile.phone)) next.phone = 'Phone must be exactly 11 digits';
    } else {
      if (!profile.medium) next.medium = 'Select a medium';
      if (profile.phone && !/^\d{11}$/.test(profile.phone)) next.phone = 'Phone must be exactly 11 digits';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const profileFields = role === 'teacher'
        ? {
            qualification: profile.qualification, institution: profile.institution,
            currentLevel: profile.currentLevel, major: profile.major,
            experienceYears: profile.experienceYears, gender: profile.gender,
            phone: profile.phone, district: profile.district, area: profile.area,
          }
        : {
            educationLevel: profile.educationLevel, institution: profile.institution,
            medium: profile.medium, phone: profile.phone,
            district: profile.district, area: profile.area,
          };

      await registerUser(fullName, email, password, role, profileFields);
      toast.success('Account created — please log in.');
      navigate('/login');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl rounded-3xl border border-forest-100 bg-cream-50 p-8 shadow-sm"
      >
        <h1 className="font-display text-2xl font-semibold text-forest-950">Create your account</h1>
        <p className="mt-1 text-sm text-ink-600">Join as a student or a tutor.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { key: 'student', label: 'Student', icon: GraduationCap },
            { key: 'teacher', label: 'Teacher', icon: BookOpen },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRole(opt.key)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-4 transition ${
                role === opt.key
                  ? 'border-forest-800 bg-forest-100 text-forest-900'
                  : 'border-forest-100 bg-white text-ink-400 hover:border-forest-100'
              }`}
            >
              <opt.icon size={22} />
              <span className="text-sm font-semibold">{opt.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
              placeholder="Your name"
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div className="sm:col-span-2 mt-2 border-t border-forest-100 pt-4">
            <p className="text-sm font-semibold text-forest-900">
              {role === 'teacher' ? 'Teacher profile' : 'Student profile'}
            </p>
            <p className="text-xs text-ink-500">This helps {role === 'teacher' ? 'students' : 'tutors'} find the right match — a couple of extra details can be added later from your dashboard.</p>
          </div>

          {fieldsForRole.map((f) => (
            <div key={f.key} className={f.span ? 'sm:col-span-2' : ''}>
              <label className="mb-1.5 block text-sm font-medium text-ink-900">{f.label}</label>
              <input
                type={f.type || 'text'}
                value={profile[f.key]}
                onChange={(e) => updateProfile(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
              />
              {errors[f.key] && <p className="mt-1 text-xs text-red-600">{errors[f.key]}</p>}
            </div>
          ))}

          {role === 'teacher' ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-900">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => updateProfile('gender', e.target.value)}
                className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-900">Medium</label>
              <select
                value={profile.medium}
                onChange={(e) => updateProfile('medium', e.target.value)}
                className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
              >
                <option value="">Select</option>
                <option value="Bangla">Bangla Medium</option>
                <option value="English">English Medium</option>
                <option value="English Version">English Version</option>
              </select>
              {errors.medium && <p className="mt-1 text-xs text-red-600">{errors.medium}</p>}
            </div>
          )}

          {serverError && (
            <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="sm:col-span-2 mt-2 rounded-xl bg-forest-900 py-3 font-semibold text-cream-50 transition hover:bg-forest-800 disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account…' : `Sign up as a ${role}`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-forest-800 ink-underline">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}