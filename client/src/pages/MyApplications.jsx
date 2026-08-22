import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { getMyPostApplications } from '@/services/activityService';
import { EmptyState, Spinner } from '@/components/shared/Primitives';

const statusStyle = {
  pending: { icon: Clock, color: 'text-amber-600 bg-amber-100' },
  accepted: { icon: CheckCircle2, color: 'text-forest-700 bg-forest-100' },
  rejected: { icon: XCircle, color: 'text-red-600 bg-red-100' },
};

export default function MyApplications() {
  const { data: applications, isLoading } = useQuery({
    queryKey: ['my-post-applications'],
    queryFn: getMyPostApplications,
  });

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-forest-950">My Applications</h1>
      <p className="mt-2 text-ink-600">Posts you've applied to, and their current status.</p>

      {!applications?.length ? (
        <div className="mt-8"><EmptyState title="You haven't applied anywhere yet" /></div>
      ) : (
        <div className="mt-8 space-y-3">
          {applications.map((a) => {
            const st = statusStyle[a.status] || statusStyle.pending;
            return (
              <Link
                key={a.application_id}
                to={`/teacher-posts/${a.post_id}`}
                className="flex items-center justify-between rounded-2xl border border-forest-100 bg-cream-50 p-5 hover:border-forest-700"
              >
                <div>
                  <p className="font-semibold text-forest-900">{a.title}</p>
                  {a.expected_salary && <p className="text-sm text-ink-600">৳{a.expected_salary}/month</p>}
                </div>
                <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${st.color}`}>
                  <st.icon size={13} /> {a.status}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
