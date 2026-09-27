import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Wallet, MapPin, Filter, X } from 'lucide-react';
import { getAllStudentRequests, searchStudentRequests } from '@/services/postService';
import { getAllSubjects } from '@/services/studentService';
import { StaggerGrid, StaggerItem } from '@/components/shared/StaggerGrid';
import { SubjectPill, EmptyState, Spinner } from '@/components/shared/Primitives';

const EMPTY_FILTERS = {
  subjectId: '', location: '', mode: '', categoryName: '', classLevel: '',
  minSalary: '', maxSalary: '', daysPerWeek: '', preferredInstitution: '',
};

export default function Requests() {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(null); // null = no filters applied yet

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: getAllSubjects });

  const { data: requests, isLoading } = useQuery({
    queryKey: ['student-requests', applied],
    queryFn: () => (applied ? searchStudentRequests(applied) : getAllStudentRequests()),
  });

  function updateDraft(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function applyFilters() {
    const cleaned = Object.fromEntries(
      Object.entries(draft).filter(([, v]) => v !== '')
    );
    setApplied(Object.keys(cleaned).length ? cleaned : null);
  }

  function clearFilters() {
    setDraft(EMPTY_FILTERS);
    setApplied(null);
  }

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

      <div className="mb-8 rounded-2xl border border-forest-100 bg-cream-50 p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-forest-800">
          <Filter size={15} /> Filters
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <select
            value={draft.subjectId}
            onChange={(e) => updateDraft('subjectId', e.target.value)}
            className="min-w-[150px] flex-1 rounded-xl border border-forest-100 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="">All subjects</option>
            {subjects?.map((s) => (
              <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
            ))}
          </select>
          <input
            value={draft.location}
            onChange={(e) => updateDraft('location', e.target.value)}
            placeholder="Location"
            className="min-w-[140px] flex-1 rounded-xl border border-forest-100 bg-white px-3 py-2 text-sm outline-none placeholder:text-ink-400"
          />
          <select
            value={draft.mode}
            onChange={(e) => updateDraft('mode', e.target.value)}
            className="min-w-[130px] rounded-xl border border-forest-100 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="">Any mode</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="both">Both</option>
          </select>
          <select
            value={draft.categoryName}
            onChange={(e) => updateDraft('categoryName', e.target.value)}
            className="min-w-[160px] rounded-xl border border-forest-100 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="">Any category</option>
            <option value="Home Tuition">Home Tuition</option>
            <option value="Online Tuition">Online Tuition</option>
            <option value="Group Tuition">Group Tuition</option>
            <option value="Admission Coaching">Admission Coaching</option>
          </select>
          <input
            value={draft.classLevel}
            onChange={(e) => updateDraft('classLevel', e.target.value)}
            placeholder="Class level"
            className="min-w-[120px] rounded-xl border border-forest-100 bg-white px-3 py-2 text-sm outline-none placeholder:text-ink-400"
          />
          <input
            type="number"
            value={draft.minSalary}
            onChange={(e) => updateDraft('minSalary', e.target.value)}
            placeholder="Min ৳"
            className="w-24 rounded-xl border border-forest-100 bg-white px-3 py-2 text-sm outline-none placeholder:text-ink-400"
          />
          <input
            type="number"
            value={draft.maxSalary}
            onChange={(e) => updateDraft('maxSalary', e.target.value)}
            placeholder="Max ৳"
            className="w-24 rounded-xl border border-forest-100 bg-white px-3 py-2 text-sm outline-none placeholder:text-ink-400"
          />
          <input
            type="number"
            value={draft.daysPerWeek}
            onChange={(e) => updateDraft('daysPerWeek', e.target.value)}
            placeholder="Days/week"
            className="w-28 rounded-xl border border-forest-100 bg-white px-3 py-2 text-sm outline-none placeholder:text-ink-400"
          />
          <input
            value={draft.preferredInstitution}
            onChange={(e) => updateDraft('preferredInstitution', e.target.value)}
            placeholder="Preferred institution"
            className="min-w-[160px] rounded-xl border border-forest-100 bg-white px-3 py-2 text-sm outline-none placeholder:text-ink-400"
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-ink-500">{isLoading ? 'Searching…' : `${requests?.length ?? 0} results found`}</p>
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-full border border-forest-100 px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-white"
            >
              <X size={14} /> Clear
            </button>
            <button
              onClick={applyFilters}
              className="rounded-full bg-forest-900 px-5 py-2 text-sm font-semibold text-cream-50 hover:bg-forest-800"
            >
              Apply
            </button>
          </div>
        </div>
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
