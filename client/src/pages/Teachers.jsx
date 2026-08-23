import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Briefcase } from 'lucide-react';
import { searchTeachers } from '@/services/teacherService';
import { getAllSubjects } from '@/services/studentService';
import { StaggerGrid, StaggerItem } from '@/components/shared/StaggerGrid';
import { SubjectPill, RatingStars, EmptyState, CardSkeletonGrid } from '@/components/shared/Primitives';

export default function Teachers() {
  const [subject, setSubject] = useState('');
  const [district, setDistrict] = useState('');

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: getAllSubjects,
  });

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers-search', subject, district],
    queryFn: () => searchTeachers({ subject: subject || undefined, district: district || undefined }),
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-semibold text-forest-950">Find a Tutor</h1>
        <p className="mt-2 text-ink-600">Browse verified tutors by subject, location, and rating.</p>
      </div>

      {/* filter bar */}
      <div className="mb-8 flex flex-wrap gap-3 rounded-2xl border border-forest-100 bg-cream-50 p-4">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-forest-100 bg-white px-3 py-2">
          <Search size={16} className="text-ink-400" />
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          >
            <option value="">All subjects</option>
            {subjects?.map((s) => (
              <option key={s.subject_id} value={s.subject_name}>{s.subject_name}</option>
            ))}
          </select>
        </div>
        <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-xl border border-forest-100 bg-white px-3 py-2">
          <MapPin size={16} className="text-ink-400" />
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="District (e.g. Dhaka)"
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
          />
        </div>
      </div>

      {isLoading ? (
        <CardSkeletonGrid count={6} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" />
      ) : !teachers?.length ? (
        <EmptyState
          title="No tutors match yet"
          description="Try a different subject or clear the district filter."
        />
      ) : (
        <StaggerGrid className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((t) => (
            <StaggerItem key={t.teacher_id}>
              <Link
                to={`/teachers/${t.teacher_id}`}
                className="group flex h-full flex-col rounded-2xl border border-forest-100 bg-cream-50 p-6 transition hover:-translate-y-1 hover:border-forest-700 hover:shadow-lg hover:shadow-forest-900/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-900 font-display text-lg font-semibold text-cream-50">
                    {t.full_name?.[0] ?? '?'}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-forest-950">{t.full_name}</h3>
                    <div className="flex items-center gap-1.5">
                      <RatingStars rating={t.avg_rating} size={13} />
                      <span className="text-xs text-ink-400">({t.total_reviews ?? 0})</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 line-clamp-2 text-sm text-ink-600">{t.qualification}</p>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-400">
                  <Briefcase size={13} /> {t.experience_years ?? 0} yrs experience
                  {t.district && <> · <MapPin size={13} /> {t.district}</>}
                </div>

                {t.subjects?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {t.subjects.slice(0, 3).map((s, i) => (
                      <SubjectPill key={i}>{s.subject_name}</SubjectPill>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-5">
                  {t.hourly_rate && (
                    <p className="font-display text-lg font-semibold text-forest-900">
                      ৳{t.hourly_rate}<span className="text-sm font-normal text-ink-400">/hr</span>
                    </p>
                  )}
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}
    </div>
  );
}
