import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Wallet, MapPin, Users } from 'lucide-react';
import { getAllTeacherPosts } from '@/services/postService';
import { StaggerGrid, StaggerItem } from '@/components/shared/StaggerGrid';
import { SubjectPill, EmptyState, CardSkeletonGrid } from '@/components/shared/Primitives';

export default function TeacherPosts() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['teacher-posts'],
    queryFn: getAllTeacherPosts,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-forest-950">Tutor Openings</h1>
          <p className="mt-2 text-ink-600">Tutors currently available — apply if the fit is right.</p>
        </div>
        <Link
          to="/teacher-posts/new"
          className="rounded-full bg-forest-900 px-6 py-3 text-sm font-semibold text-cream-50 hover:bg-forest-800"
        >
          Publish a post
        </Link>
      </div>

      {isLoading ? (
        <CardSkeletonGrid count={6} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" />
      ) : !posts?.length ? (
        <EmptyState title="No open posts right now" />
      ) : (
        <StaggerGrid className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <StaggerItem key={p.post_id}>
              <Link
                to={`/teacher-posts/${p.post_id}`}
                className="group flex h-full flex-col rounded-2xl border border-forest-100 bg-cream-50 p-6 transition hover:-translate-y-1 hover:border-forest-700 hover:shadow-lg hover:shadow-forest-900/5"
              >
                <div className="flex items-center justify-between">
                  <SubjectPill>{p.subject_name}</SubjectPill>
                  {p.class_level && (
                    <span className="rounded-full bg-forest-950 px-2.5 py-0.5 text-[11px] font-semibold text-cream-50">
                      {p.class_level}
                    </span>
                  )}
                </div>

                <h3 className="mt-4 font-display text-lg font-semibold text-forest-950">{p.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-ink-600">{p.description}</p>

                <div className="mt-4 space-y-1.5 text-xs text-ink-400">
                  {p.location && <div className="flex items-center gap-1.5"><MapPin size={13} />{p.location}</div>}
                  {p.days_per_week && <div className="flex items-center gap-1.5"><Calendar size={13} />{p.days_per_week} days/week</div>}
                  {p.vacancy && <div className="flex items-center gap-1.5"><Users size={13} />{p.vacancy} vacancy</div>}
                </div>

                <div className="mt-auto flex items-center justify-between pt-5">
                  {p.expected_salary && (
                    <p className="flex items-center gap-1 font-display text-lg font-semibold text-forest-900">
                      <Wallet size={16} className="text-amber-500" /> ৳{p.expected_salary}
                    </p>
                  )}
                  <p className="text-xs text-ink-400">{p.teacher_name}</p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}
    </div>
  );
}
