import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getMyReports, getReportsAboutMe } from '@/services/reportService';
import { Spinner, EmptyState } from '@/components/shared/Primitives';

const STATUS_LABELS = {
  pending: 'Pending',
  under_review: 'Under review',
  explanation_requested: 'Explanation requested',
  explanation_received: 'Explanation received',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800',
  under_review: 'bg-amber-100 text-amber-800',
  explanation_requested: 'bg-amber-100 text-amber-800',
  explanation_received: 'bg-forest-100 text-forest-800',
  resolved: 'bg-forest-100 text-forest-800',
  dismissed: 'bg-ink-100 text-ink-700',
};

function ReportRow({ r, otherLabel, otherName }) {
  return (
    <Link
      to={`/reports/${r.report_id}`}
      className="block rounded-2xl border border-forest-100 bg-cream-50 p-5 transition hover:border-forest-700"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-400">#{r.report_id} · {otherLabel}: {otherName}</p>
          <p className="mt-1 font-semibold text-forest-950 capitalize">{r.reason.replace(/_/g, ' ')}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
          {STATUS_LABELS[r.status]}
        </span>
      </div>
    </Link>
  );
}

export default function MyReports() {
  const { data: filed, isLoading: filedLoading } = useQuery({ queryKey: ['my-reports'], queryFn: getMyReports });
  const { data: aboutMe, isLoading: aboutMeLoading } = useQuery({ queryKey: ['reports-about-me'], queryFn: getReportsAboutMe });

  if (filedLoading || aboutMeLoading) return <div className="flex min-h-[50vh] items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold text-forest-950">My Reports</h1>
        <p className="mt-1 text-sm text-ink-600">Reports you've filed, and any filed about you.</p>
      </motion.div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Reports you filed</h2>
        {!filed?.length ? (
          <EmptyState title="No reports filed" description="Reports you submit about a match will appear here." />
        ) : (
          <div className="space-y-3">
            {filed.map((r) => <ReportRow key={r.report_id} r={r} otherLabel="Reported" otherName={r.reported_name} />)}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">Reports about you</h2>
        {!aboutMe?.length ? (
          <EmptyState title="Nothing here" description="If someone reports a match involving you, it'll show up here." />
        ) : (
          <div className="space-y-3">
            {aboutMe.map((r) => (
              <Link
                key={r.report_id}
                to={`/reports/${r.report_id}`}
                className="block rounded-2xl border border-forest-100 bg-cream-50 p-5 transition hover:border-forest-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-forest-950 capitalize">#{r.report_id} · {r.reason.replace(/_/g, ' ')}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
                {r.status === 'explanation_requested' && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    Deadline: {new Date(r.explanation_deadline).toLocaleString()} — open this to respond
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}