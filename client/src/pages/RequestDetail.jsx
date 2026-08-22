import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Wallet, MapPin, GraduationCap, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getStudentRequestById } from '@/services/postService';
import { useAuth } from '@/context/AuthContext';
import { Spinner, SubjectPill } from '@/components/shared/Primitives';

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: () => getStudentRequestById(id),
  });

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;
  if (!request) return null;

  const rows = [
    { icon: GraduationCap, label: 'Class Level', value: request.class_level },
    { icon: Calendar, label: 'Days per week', value: request.days_per_week },
    { icon: Clock, label: 'Preferred time', value: request.preferred_time },
    { icon: MapPin, label: 'Location', value: request.location },
    { icon: MapPin, label: 'Institution preference', value: request.preferred_institution },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-forest-100 bg-cream-50 p-8"
      >
        <div className="flex flex-wrap items-center gap-3">
          <SubjectPill>{request.subject_name}</SubjectPill>
          <span className="rounded-full bg-forest-950 px-3 py-1 text-xs font-semibold text-cream-50">
            {request.category_name}
          </span>
        </div>

        <h1 className="mt-4 font-display text-3xl font-semibold text-forest-950">
          {request.subject_name} tutor needed — {request.class_level}
        </h1>
        <p className="mt-3 text-ink-600">{request.description}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {rows.filter((r) => r.value).map((r) => (
            <div key={r.label} className="flex items-start gap-3 rounded-xl bg-white/60 p-3">
              <r.icon size={17} className="mt-0.5 shrink-0 text-forest-700" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{r.label}</p>
                <p className="text-sm font-medium text-ink-900">{r.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between rounded-2xl bg-forest-100 p-5">
          <div>
            {request.salary && (
              <p className="flex items-center gap-1.5 font-display text-2xl font-semibold text-forest-900">
                <Wallet size={20} className="text-amber-600" /> ৳{request.salary}
              </p>
            )}
            <p className="text-sm text-ink-600">Posted by {request.student_name}</p>
          </div>

          {user?.role === 'teacher' ? (
            <button
              onClick={() => toast('Applying to student requests directly is coming soon — for now, apply from Job Board posts you create.')}
              className="rounded-full bg-forest-900 px-7 py-3 font-semibold text-cream-50 hover:bg-forest-800"
            >
              Apply Now
            </button>
          ) : !user ? (
            <a href="/login" className="rounded-full bg-forest-900 px-7 py-3 font-semibold text-cream-50 hover:bg-forest-800">
              Log in to apply
            </a>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
