import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, MapPin, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMyMatches } from '@/services/matchService';
import { Spinner, EmptyState, SubjectPill } from '@/components/shared/Primitives';

const STATUS_STYLES = {
  active: 'bg-forest-100 text-forest-800',
  completed: 'bg-ink-100 text-ink-700',
  cancelled: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] || 'bg-ink-100 text-ink-700'}`}>
      {status === 'active' && <CheckCircle2 size={12} />}
      {status === 'cancelled' && <XCircle size={12} />}
      {status}
    </span>
  );
}

export default function MyMatches() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const { data: matches, isLoading, isError } = useQuery({
    queryKey: ['my-matches'],
    queryFn: getMyMatches,
  });

  if (isLoading) return <div className="flex min-h-[50vh] items-center justify-center"><Spinner /></div>;
  if (isError) {
    return <p className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-red-700">Could not load your matches.</p>;
  }
  if (!matches?.length) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <EmptyState title="No matches yet" description="Once an application is accepted, the match will appear here." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold text-forest-950">My Matches</h1>
        <p className="mt-1 text-sm text-ink-600">
          Everyone you've been matched with through an accepted application.
        </p>
      </motion.div>

      <div className="mt-8 space-y-3">
        {matches.map((m) => (
          <Link
            key={m.match_id}
            to={`/matches/${m.match_id}`}
            className="block rounded-2xl border border-forest-100 bg-cream-50 p-5 transition hover:border-forest-700"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-forest-950">
                    {isTeacher ? m.student_name : m.teacher_name}
                  </p>
                  {m.subject_name && <SubjectPill>{m.subject_name}</SubjectPill>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-ink-600">
                  {m.location && (
                    <span className="flex items-center gap-1"><MapPin size={14} /> {m.location}</span>
                  )}
                  {m.rate && (
                    <span className="flex items-center gap-1"><Wallet size={14} /> ৳{m.rate}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> Since {new Date(m.started_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <StatusBadge status={m.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}