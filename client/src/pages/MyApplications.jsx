import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle2, Clock, XCircle, Star } from 'lucide-react';
import { getMyPostApplications } from '@/services/activityService';
import { EmptyState, Spinner } from '@/components/shared/Primitives';

const statusStyle = {
  pending: { icon: Clock, color: 'text-amber-600 bg-amber-100', hex: '#e8a33d' },
  accepted: { icon: CheckCircle2, color: 'text-forest-700 bg-forest-100', hex: '#1a6b4f' },
  rejected: { icon: XCircle, color: 'text-red-600 bg-red-100', hex: '#dc2626' },
};

export default function MyApplications() {
  const { data: applications, isLoading } = useQuery({
    queryKey: ['my-post-applications'],
    queryFn: getMyPostApplications,
  });

  const summary = useMemo(() => {
    if (!applications?.length) return [];
    const counts = { pending: 0, accepted: 0, rejected: 0 };
    for (const a of applications) {
      if (counts[a.status] !== undefined) counts[a.status] += 1;
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({ status, count }));
  }, [applications]);

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-forest-950">My Applications</h1>
      <p className="mt-2 text-ink-600">Posts you've applied to, and their current status.</p>

      {!applications?.length ? (
        <div className="mt-8"><EmptyState title="You haven't applied anywhere yet" /></div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-6 rounded-2xl border border-forest-100 bg-cream-50 p-5">
            <ResponsiveContainer width={140} height={70}>
              <BarChart data={summary} barSize={22}>
                <XAxis dataKey="status" hide />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {summary.map((entry) => (
                    <Cell key={entry.status} fill={statusStyle[entry.status]?.hex} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
              {summary.map((entry) => (
                <div key={entry.status} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: statusStyle[entry.status]?.hex }}
                  />
                  <span className="capitalize text-ink-600">{entry.status}</span>
                  <span className="font-semibold text-forest-900">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {applications.map((a) => {
              const st = statusStyle[a.status] || statusStyle.pending;
              return (
                <div
                  key={a.application_id}
                  className="flex items-center justify-between rounded-2xl border border-forest-100 bg-cream-50 p-5"
                >
                  <Link to={`/teacher-posts/${a.post_id}`} className="flex-1 hover:opacity-80">
                    <p className="font-semibold text-forest-900">{a.title}</p>
                    {a.expected_salary && <p className="text-sm text-ink-600">৳{a.expected_salary}/month</p>}
                  </Link>

                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${st.color}`}>
                      <st.icon size={13} /> {a.status}
                    </span>

                    {a.status === 'accepted' && a.match_id && (
                      <Link
                        to={`/reviews/write/${a.match_id}`}
                        className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                      >
                        <Star size={12} /> Review
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}