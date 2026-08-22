import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { GraduationCap, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(data) {
    setServerError('');
    try {
      await registerUser(data.fullName, data.email, data.password, role);
      toast.success('Account created — please log in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setServerError(msg);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl border border-forest-100 bg-cream-50 p-8 shadow-sm"
      >
        <h1 className="font-display text-2xl font-semibold text-forest-950">Create your account</h1>
        <p className="mt-1 text-sm text-ink-600">Join as a student or a tutor — takes under a minute.</p>

        {/* role toggle */}
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

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-ink-900">
              Full name
            </label>
            <input
              id="fullName"
              {...register('fullName')}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
              placeholder="Your name"
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-900">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-900">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
              placeholder="At least 6 characters"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-forest-900 py-3 font-semibold text-cream-50 transition hover:bg-forest-800 disabled:opacity-60"
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
