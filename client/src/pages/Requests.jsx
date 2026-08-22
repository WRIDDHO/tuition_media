import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Wallet, MapPin } from 'lucide-react';
import { getAllStudentRequests } from '@/services/postService';
import { StaggerGrid, StaggerItem } from '@/components/shared/StaggerGrid';
import { SubjectPill, EmptyState, Spinner } from '@/components/shared/Primitives';

export default function Requests() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ['student-requests'],
    queryFn: getAllStudentRequests,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-forest-950">Job Board</h1>
          <p className="mt-2 text-ink-600">Students looking for a tutor — apply directly if you're a good fit.</p>
        </div>
        <Link
          to="/requests/new"
          className="rounded-full bg-forest-900 px-6 py-3 text-sm font-semibold text-cream-50 hover:bg-forest-800"
        >
          Post a request
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : !requests?.length ? (
        <EmptyState title="No open requests right now" description="Check back soon, or post your own." />
      ) : (
        <StaggerGrid className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((r) => (
            <StaggerItem key={r.request_id}>
              <Link
                to={`/requests/${r.request_id}`}
                className="group flex h-full flex-col rounded-2xl border border-forest-100 bg-cream-50 p-6 transition hover:-translate-y-1 hover:border-forest-700 hover:shadow-lg hover:shadow-forest-900/5"
              >
                <div className="flex items-center justify-between">
                  <SubjectPill>{r.subject_name}</SubjectPill>
                  <span className="rounded-full bg-forest-950 px-2.5 py-0.5 text-[11px] font-semibold text-cream-50">
                    {r.class_level}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-lg font-semibold text-forest-950">{r.category_name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-ink-600">{r.description}</p>

                <div className="mt-4 space-y-1.5 text-xs text-ink-400">
                  {r.location && <div className="flex items-center gap-1.5"><MapPin size={13} />{r.location}</div>}
                  {r.days_per_week && <div className="flex items-center gap-1.5"><Calendar size={13} />{r.days_per_week} days/week</div>}
                </div>

                <div className="mt-auto flex items-center justify-between pt-5">
                  {r.salary && (
                    <p className="flex items-center gap-1 font-display text-lg font-semibold text-forest-900">
                      <Wallet size={16} className="text-amber-500" /> ৳{r.salary}
                    </p>
                  )}
                  <p className="text-xs text-ink-400">{r.student_name}</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}
    </div>
  );
}
