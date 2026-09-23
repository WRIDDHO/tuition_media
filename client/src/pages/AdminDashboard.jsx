import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users, GraduationCap, Clock, ShieldAlert, FileText, ClipboardList,
  HelpCircle, BookOpen, CheckCircle2, XCircle, Ban, RotateCcw, Trash2, X, ArrowLeft,AlertTriangle, MessageSquareWarning,
} from 'lucide-react';
import {
  getPlatformStats,
  getPendingTeachers,
  getAllTeachers,
  approveTeacher,
  rejectTeacher,
  getAllStudents,
  suspendAccount,
  activateAccount,
  deleteAccount,
  getAllMatches, 
  getReportStats,
  getAllReports,
  getReportDetail,
  reviewReport,
  requestExplanation,
  resolveReport,
} from '@/services/adminService';
import { getAllTeacherPosts, getAllStudentRequests, deleteTeacherPost, deleteStudentRequest } from '@/services/postService';
import { getAllQuestions, deleteQuestion, getAllResources, deleteResource } from '@/services/activityService';
import { Spinner, EmptyState } from '@/components/shared/Primitives';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'pending', label: 'Pending teachers' },
  { key: 'teachers', label: 'Teachers' },
  { key: 'students', label: 'Students' },
  { key: 'matches', label: 'Matches made' },
  { key: 'reports', label: 'Reports' },
];

const STATUS_STYLES = {
  active: 'bg-forest-100 text-forest-800',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] || 'bg-ink-100 text-ink-700'}`}>
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------
// Reason modal: replaces window.confirm + window.prompt for any admin
// action that asks for an optional reason (suspend / delete / reject).
// Purely presentational -- the caller decides what happens on confirm.
// ---------------------------------------------------------------------

function ReasonModal({ open, title, description, confirmLabel, danger, isPending, onConfirm, onCancel, hideReason }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-forest-100 bg-cream-50 p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-lg font-semibold text-forest-950">{title}</h3>
              <button onClick={onCancel} className="rounded-lg p-1 text-ink-400 hover:bg-forest-100 hover:text-ink-700">
                <X size={18} />
              </button>
            </div>
            {description && <p className="mt-1.5 text-sm text-ink-600">{description}</p>}

            {!hideReason && (
              <>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Reason (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="Explain why, for the audit log…"
                  className="mt-1.5 w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
                />
              </>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onCancel}
                disabled={isPending}
                className="rounded-xl border border-forest-100 px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(reason)}
                disabled={isPending}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-cream-50 disabled:opacity-60 ${
                  danger ? 'bg-red-600 hover:bg-red-700' : 'bg-forest-900 hover:bg-forest-800'
                }`}
              >
                {isPending ? 'Working…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BackToOverview({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-900"
    >
      <ArrowLeft size={15} /> Back to overview
    </button>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const isExtraTab = !TABS.some((t) => t.key === tab);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold text-forest-950">Admin dashboard</h1>
        <p className="mt-1 text-sm text-ink-600">Platform statistics, teacher verification, and account management.</p>
      </motion.div>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-forest-100 pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.key ? 'bg-forest-900 text-cream-50' : 'text-ink-600 hover:bg-forest-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {isExtraTab && <BackToOverview onBack={() => setTab('overview')} />}
        {tab === 'overview' && <OverviewTab onNavigate={setTab} />}
        {tab === 'pending' && <PendingTeachersTab />}
        {tab === 'teachers' && <TeachersTab />}
        {tab === 'students' && <StudentsTab />}
        {tab === 'suspended' && <SuspendedAccountsTab />}
        {tab === 'posts' && <TeacherPostsModerationTab />}
        {tab === 'requests' && <StudentRequestsModerationTab />}
        {tab === 'questions' && <QuestionsModerationTab />}
        {tab === 'resources' && <ResourcesModerationTab />}
        {tab === 'matches' && <MatchesTab />}
        {tab === 'reports' && <ReportsTab />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Overview: platform statistics from get_platform_stats()
// ---------------------------------------------------------------------

const STAT_CARDS = [
  { key: 'total_students', label: 'Students', icon: GraduationCap, tab: 'students' },
  { key: 'total_teachers', label: 'Teachers', icon: Users, tab: 'teachers' },
  { key: 'pending_teachers', label: 'Pending teachers', icon: Clock, tab: 'pending' },
  { key: 'suspended_users', label: 'Suspended accounts', icon: ShieldAlert, tab: 'suspended' },
  { key: 'active_teacher_posts', label: 'Active tuition posts', icon: FileText, tab: 'posts' },
  { key: 'active_student_requests', label: 'Active student requests', icon: ClipboardList, tab: 'requests' },
  { key: 'total_matches', label: 'Matches made', icon: CheckCircle2 }, // no admin view yet
  { key: 'total_questions', label: 'Questions asked', icon: HelpCircle, tab: 'questions' },
  { key: 'total_resources', label: 'Resources shared', icon: BookOpen, tab: 'resources' },
];

function OverviewTab({ onNavigate }) {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getPlatformStats,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (isError) return <ErrorNote message="Could not load platform statistics." />;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {STAT_CARDS.map((c) => {
        const Wrapper = c.tab ? 'button' : 'div';
        return (
          <Wrapper
            key={c.key}
            onClick={c.tab ? () => onNavigate(c.tab) : undefined}
            title={c.tab ? undefined : 'No detail view yet'}
            className={`rounded-2xl border border-forest-100 bg-cream-50 p-5 text-left ${
              c.tab ? 'cursor-pointer transition hover:border-forest-700 hover:shadow-sm' : ''
            }`}
          >
            <c.icon size={20} className="text-forest-700" />
            <p className="mt-3 font-display text-2xl font-semibold text-forest-950">
              {stats?.[c.key] ?? 0}
            </p>
            <p className="text-sm text-ink-600">{c.label}</p>
          </Wrapper>
        );
      })}
    </div>
  );
}

function ErrorNote({ message }) {
  return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>;
}

// ---------------------------------------------------------------------
// Pending teachers: approve / reject
// ---------------------------------------------------------------------

function PendingTeachersTab() {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState(null);

  const { data: teachers, isLoading, isError } = useQuery({
    queryKey: ['admin-pending-teachers'],
    queryFn: getPendingTeachers,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-pending-teachers'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const approveMutation = useMutation({
    mutationFn: (userId) => approveTeacher(userId),
    onSuccess: (data) => {
      toast.success(data.message || 'Teacher approved');
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not approve teacher'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }) => rejectTeacher(userId, reason),
    onSuccess: (data) => {
      toast.success(data.message || 'Teacher rejected');
      setRejectingId(null);
      invalidate();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not reject teacher'),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (isError) return <ErrorNote message="Could not load pending teachers." />;
  if (!teachers?.length) {
    return <EmptyState title="No pending teachers" description="Every teacher application has been reviewed." />;
  }

  return (
    <div className="space-y-3">
      {teachers.map((t) => (
        <div key={t.user_id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-forest-100 bg-cream-50 p-5">
          <div>
            <p className="font-semibold text-forest-950">{t.full_name}</p>
            <p className="text-sm text-ink-600">{t.email}</p>
            <p className="mt-1 text-sm text-ink-500">
              {t.qualification || 'No qualification listed'}{t.institution ? ` · ${t.institution}` : ''}
              {typeof t.experience_years === 'number' ? ` · ${t.experience_years} yrs experience` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => approveMutation.mutate(t.user_id)}
              disabled={approveMutation.isPending}
              className="flex items-center gap-1.5 rounded-xl bg-forest-900 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
            >
              <CheckCircle2 size={16} /> Approve
            </button>
            <button
              onClick={() => setRejectingId(t.user_id)}
              disabled={rejectMutation.isPending}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              <XCircle size={16} /> Reject
            </button>
          </div>
        </div>
      ))}

      <ReasonModal
        open={rejectingId !== null}
        title="Reject this teacher application?"
        description="They'll be notified and can contact support if they think this is a mistake."
        confirmLabel="Reject application"
        danger
        isPending={rejectMutation.isPending}
        onConfirm={(reason) => rejectMutation.mutate({ userId: rejectingId, reason })}
        onCancel={() => setRejectingId(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// Shared account-actions row: suspend/activate/delete, used by Teachers,
// Students and the combined Suspended-accounts view.
// ---------------------------------------------------------------------

function AccountActions({ userId, accountStatus, onSuspend, onActivate, onDelete, busy }) {
  const [modal, setModal] = useState(null); // null | 'suspend' | 'delete'

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {accountStatus === 'suspended' ? (
          <button
            onClick={() => onActivate(userId, '')}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-xl border border-forest-200 px-3 py-1.5 text-xs font-semibold text-forest-800 hover:bg-forest-50 disabled:opacity-60"
          >
            <RotateCcw size={14} /> Reactivate
          </button>
        ) : (
          <button
            onClick={() => setModal('suspend')}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60"
          >
            <Ban size={14} /> Suspend
          </button>
        )}
        <button
          onClick={() => setModal('delete')}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>

      <ReasonModal
        open={modal === 'suspend'}
        title="Suspend this account?"
        description="They will not be able to log in until you reactivate it."
        confirmLabel="Suspend"
        danger={false}
        isPending={busy}
        onConfirm={(reason) => { onSuspend(userId, reason); setModal(null); }}
        onCancel={() => setModal(null)}
      />
      <ReasonModal
        open={modal === 'delete'}
        title="Delete this account permanently?"
        description="This cannot be undone."
        confirmLabel="Delete account"
        danger
        isPending={busy}
        onConfirm={(reason) => { onDelete(userId, reason); setModal(null); }}
        onCancel={() => setModal(null)}
      />
    </>
  );
}

function Pager({ page, limit, totalCount, onPageChange }) {
  const totalPages = Math.max(Math.ceil(totalCount / limit), 1);
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm text-ink-600">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-forest-100 px-3 py-1 disabled:opacity-40"
      >
        Previous
      </button>
      <span>Page {page} of {totalPages}</span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-lg border border-forest-100 px-3 py-1 disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------
// Teachers tab: all teachers regardless of status, paginated
// ---------------------------------------------------------------------

function TeachersTab() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-teachers', page],
    queryFn: () => getAllTeachers({ page }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason }) => suspendAccount(userId, reason),
    onSuccess: (d) => { toast.success(d.message || 'Account suspended'); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not suspend account'),
  });
  const activateMutation = useMutation({
    mutationFn: ({ userId, reason }) => activateAccount(userId, reason),
    onSuccess: (d) => { toast.success(d.message || 'Account reactivated'); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not reactivate account'),
  });
  const deleteMutation = useMutation({
    mutationFn: ({ userId, reason }) => deleteAccount(userId, reason),
    onSuccess: (d) => { toast.success(d.message || 'Account deleted'); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not delete account'),
  });

  const busy = suspendMutation.isPending || activateMutation.isPending || deleteMutation.isPending;

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (isError) return <ErrorNote message="Could not load teachers." />;
  if (!data?.teachers?.length) {
    return <EmptyState title="No teachers yet" description="Approved and pending teachers will appear here." />;
  }

  return (
    <div>
      <div className="space-y-3">
        {data.teachers.map((t) => (
          <div key={t.user_id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-forest-100 bg-cream-50 p-5">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-forest-950">{t.full_name}</p>
                <StatusBadge status={t.account_status} />
              </div>
              <p className="text-sm text-ink-600">{t.email}</p>
              {t.district && <p className="mt-1 text-sm text-ink-500">{t.district}{t.area ? `, ${t.area}` : ''}</p>}
            </div>
            <AccountActions
              userId={t.user_id}
              accountStatus={t.account_status}
              busy={busy}
              onSuspend={(userId, reason) => suspendMutation.mutate({ userId, reason })}
              onActivate={(userId, reason) => activateMutation.mutate({ userId, reason })}
              onDelete={(userId, reason) => deleteMutation.mutate({ userId, reason })}
            />
          </div>
        ))}
      </div>
      <Pager page={data.page} limit={data.limit} totalCount={data.totalCount} onPageChange={setPage} />
    </div>
  );
}

// ---------------------------------------------------------------------
// Students tab: same shape as Teachers tab
// ---------------------------------------------------------------------

function StudentsTab() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-students', page],
    queryFn: () => getAllStudents({ page }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const suspendMutation = useMutation({
    mutationFn: ({ userId, reason }) => suspendAccount(userId, reason),
    onSuccess: (d) => { toast.success(d.message || 'Account suspended'); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not suspend account'),
  });
  const activateMutation = useMutation({
    mutationFn: ({ userId, reason }) => activateAccount(userId, reason),
    onSuccess: (d) => { toast.success(d.message || 'Account reactivated'); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not reactivate account'),
  });
  const deleteMutation = useMutation({
    mutationFn: ({ userId, reason }) => deleteAccount(userId, reason),
    onSuccess: (d) => { toast.success(d.message || 'Account deleted'); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not delete account'),
  });

  const busy = suspendMutation.isPending || activateMutation.isPending || deleteMutation.isPending;

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (isError) return <ErrorNote message="Could not load students." />;
  if (!data?.students?.length) {
    return <EmptyState title="No students yet" description="Registered students will appear here." />;
  }

  return (
    <div>
      <div className="space-y-3">
        {data.students.map((s) => (
          <div key={s.user_id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-forest-100 bg-cream-50 p-5">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-forest-950">{s.full_name}</p>
                <StatusBadge status={s.account_status} />
              </div>
              <p className="text-sm text-ink-600">{s.email}</p>
              {s.district && <p className="mt-1 text-sm text-ink-500">{s.district}{s.area ? `, ${s.area}` : ''}</p>}
            </div>
            <AccountActions
              userId={s.user_id}
              accountStatus={s.account_status}
              busy={busy}
              onSuspend={(userId, reason) => suspendMutation.mutate({ userId, reason })}
              onActivate={(userId, reason) => activateMutation.mutate({ userId, reason })}
              onDelete={(userId, reason) => deleteMutation.mutate({ userId, reason })}
            />
          </div>
        ))}
      </div>
      <Pager page={data.page} limit={data.limit} totalCount={data.totalCount} onPageChange={setPage} />
    </div>
  );
}

// ---------------------------------------------------------------------
// Suspended accounts: teachers + students merged, filtered client-side.
// NOTE: pulls up to 100 of each list rather than paginating -- fine for
// a "how many suspended accounts do we have" view, but if this project
// ever has 100+ teachers or students, the limit below should grow (or
// this should become a real backend-filtered endpoint instead).
// ---------------------------------------------------------------------

function SuspendedAccountsTab() {
  const queryClient = useQueryClient();

  const { data: teacherData, isLoading: teachersLoading } = useQuery({
    queryKey: ['admin-teachers-for-suspended'],
    queryFn: () => getAllTeachers({ page: 1, limit: 100 }),
  });
  const { data: studentData, isLoading: studentsLoading } = useQuery({
    queryKey: ['admin-students-for-suspended'],
    queryFn: () => getAllStudents({ page: 1, limit: 100 }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-teachers-for-suspended'] });
    queryClient.invalidateQueries({ queryKey: ['admin-students-for-suspended'] });
    queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
    queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const activateMutation = useMutation({
    mutationFn: ({ userId, reason }) => activateAccount(userId, reason),
    onSuccess: (d) => { toast.success(d.message || 'Account reactivated'); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not reactivate account'),
  });
  const deleteMutation = useMutation({
    mutationFn: ({ userId, reason }) => deleteAccount(userId, reason),
    onSuccess: (d) => { toast.success(d.message || 'Account deleted'); invalidate(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not delete account'),
  });

  const busy = activateMutation.isPending || deleteMutation.isPending;

  if (teachersLoading || studentsLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const suspended = [
    ...(teacherData?.teachers || []).filter((t) => t.account_status === 'suspended').map((t) => ({ ...t, role: 'Teacher' })),
    ...(studentData?.students || []).filter((s) => s.account_status === 'suspended').map((s) => ({ ...s, role: 'Student' })),
  ];

  if (!suspended.length) {
    return <EmptyState title="No suspended accounts" description="Suspended teachers and students will appear here." />;
  }

  return (
    <div className="space-y-3">
      {suspended.map((u) => (
        <div key={`${u.role}-${u.user_id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-forest-100 bg-cream-50 p-5">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-forest-950">{u.full_name}</p>
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-700">{u.role}</span>
              <StatusBadge status={u.account_status} />
            </div>
            <p className="text-sm text-ink-600">{u.email}</p>
          </div>
          <AccountActions
            userId={u.user_id}
            accountStatus={u.account_status}
            busy={busy}
            onSuspend={() => {}}
            onActivate={(userId, reason) => activateMutation.mutate({ userId, reason })}
            onDelete={(userId, reason) => deleteMutation.mutate({ userId, reason })}
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Generic content-moderation list: same shape used for teacher posts,
// student requests, questions, and resources -- fetch everything with
// the existing public "list all" endpoint, show a delete button that
// calls the existing admin-aware delete endpoint for that content type.
// ---------------------------------------------------------------------

function ContentModerationList({ queryKey, queryFn, deleteFn, emptyTitle, emptyDescription, getTitle, getSubtitle, getId }) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);

  const { data: items, isLoading, isError } = useQuery({ queryKey, queryFn });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFn(id),
    onSuccess: () => {
      toast.success('Removed');
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not remove this item'),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (isError) return <ErrorNote message="Could not load this list." />;
  if (!items?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const id = getId(item);
        return (
          <div key={id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-forest-100 bg-cream-50 p-5">
            <div>
              <p className="font-semibold text-forest-950">{getTitle(item)}</p>
              <p className="text-sm text-ink-600">{getSubtitle(item)}</p>
            </div>
            <button
              onClick={() => setDeletingId(id)}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        );
      })}

      <ReasonModal
        open={deletingId !== null}
        title="Remove this item?"
        description="This cannot be undone."
        confirmLabel="Remove"
        danger
        hideReason
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deletingId)}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}

function TeacherPostsModerationTab() {
  return (
    <ContentModerationList
      queryKey={['admin-teacher-posts']}
      queryFn={getAllTeacherPosts}
      deleteFn={deleteTeacherPost}
      emptyTitle="No tuition posts"
      emptyDescription="Posts published by teachers will appear here."
      getId={(p) => p.post_id}
      getTitle={(p) => p.title}
      getSubtitle={(p) => `${p.subject_name || ''}${p.teacher_name ? ` · by ${p.teacher_name}` : ''} · ${p.status}`}
    />
  );
}

function StudentRequestsModerationTab() {
  return (
    <ContentModerationList
      queryKey={['admin-student-requests']}
      queryFn={getAllStudentRequests}
      deleteFn={deleteStudentRequest}
      emptyTitle="No student requests"
      emptyDescription="Requests posted by students will appear here."
      getId={(r) => r.request_id}
      getTitle={(r) => r.subject_name || r.title || `Request #${r.request_id}`}
      getSubtitle={(r) => `${r.class_level ? `${r.class_level} · ` : ''}${r.location || ''} · ${r.status}`}
    />
  );
}

function QuestionsModerationTab() {
  return (
    <ContentModerationList
      queryKey={['admin-questions']}
      queryFn={getAllQuestions}
      deleteFn={deleteQuestion}
      emptyTitle="No questions"
      emptyDescription="Q&A community questions will appear here."
      getId={(q) => q.question_id}
      getTitle={(q) => q.title}
      getSubtitle={(q) => `${q.subject_name || ''}${q.asked_by ? ` · asked by ${q.asked_by}` : ''} · ${q.status}`}
    />
  );
}

function ResourcesModerationTab() {
  return (
    <ContentModerationList
      queryKey={['admin-resources']}
      queryFn={getAllResources}
      deleteFn={deleteResource}
      emptyTitle="No resources"
      emptyDescription="Resources uploaded by teachers will appear here."
      getId={(r) => r.resource_id}
      getTitle={(r) => r.title}
      getSubtitle={(r) => `${r.subject_name || ''}${r.teacher_name ? ` · by ${r.teacher_name}` : ''}`}
    />
  );
}

// ---------------------------------------------------------------------
// Matches: read-only oversight list. There is no cancel/delete procedure
// for matches in the DB, so this tab only shows who matched with whom.
// ---------------------------------------------------------------------

function MatchesTab() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-matches', page],
    queryFn: () => getAllMatches({ page }),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;
  if (isError) return <ErrorNote message="Could not load matches." />;
  if (!data?.matches?.length) {
    return <EmptyState title="No matches yet" description="Accepted applications will appear here as matches." />;
  }

  return (
    <div>
      <div className="space-y-3">
        {data.matches.map((m) => (
          <div key={m.match_id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-forest-100 bg-cream-50 p-5">
            <div>
              <p className="font-semibold text-forest-950">
                {m.teacher_name} <span className="text-ink-400">×</span> {m.student_name}
              </p>
              <p className="text-sm text-ink-600">
                {m.subject_name || 'Subject unknown'}{m.post_title ? ` · ${m.post_title}` : ''}
              </p>
              <p className="mt-1 text-xs text-ink-400">
                Started {new Date(m.started_at).toLocaleDateString()}
              </p>
            </div>
            <StatusBadge status={m.status} />
          </div>
        ))}
      </div>
      <Pager page={data.page} limit={data.limit} totalCount={data.totalCount} onPageChange={setPage} />
    </div>
  );
}
// ---------------------------------------------------------------------
// Reports: six status buckets, a detail panel per report, and the
// three admin actions -- start review, request explanation, resolve.
// ---------------------------------------------------------------------

const REPORT_BUCKETS = [
  { key: 'pending', label: 'Pending', statKey: 'pending' },
  { key: 'under_review', label: 'Under review', statKey: 'under_review' },
  { key: 'waiting', label: 'Waiting for explanation', statKey: 'waiting_for_explanation' },
  { key: 'explanation_received', label: 'Explanation received', statKey: 'explanation_received' },
  { key: 'resolved', label: 'Resolved', statKey: 'resolved' },
  { key: 'dismissed', label: 'Dismissed', statKey: 'dismissed' },
];

const REPORT_STATUS_LABELS = {
  pending: 'Pending', under_review: 'Under review',
  explanation_requested: 'Explanation requested', explanation_received: 'Explanation received',
  resolved: 'Resolved', dismissed: 'Dismissed',
};

function ReportsTab() {
  const [bucket, setBucket] = useState('pending');
  const [openReportId, setOpenReportId] = useState(null);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({ queryKey: ['admin-report-stats'], queryFn: getReportStats });
  const { data: reports, isLoading, isError } = useQuery({
    queryKey: ['admin-reports', bucket],
    queryFn: () => getAllReports({ status: bucket }),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    queryClient.invalidateQueries({ queryKey: ['admin-report-stats'] });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {REPORT_BUCKETS.map((b) => (
          <button
            key={b.key}
            onClick={() => setBucket(b.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              bucket === b.key ? 'bg-forest-900 text-cream-50' : 'bg-forest-50 text-ink-600 hover:bg-forest-100'
            }`}
          >
            {b.label} {stats ? `(${stats[b.statKey] ?? 0})` : ''}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : isError ? (
        <ErrorNote message="Could not load reports." />
      ) : !reports?.length ? (
        <EmptyState title="Nothing in this bucket" description="Reports matching this status will appear here." />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <button
              key={r.report_id}
              onClick={() => setOpenReportId(r.report_id)}
              className="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-forest-100 bg-cream-50 p-5 text-left transition hover:border-forest-700"
            >
              <div>
                <p className="text-sm text-ink-400">
                  #{r.report_id} · {r.reporter_name} <span className="text-ink-300">reported</span> {r.reported_name}
                </p>
                <p className="mt-1 font-semibold text-forest-950 capitalize">{r.reason.replace(/_/g, ' ')}</p>
                <p className="mt-1 text-xs text-ink-400">
                  Match #{r.match_id} · match status: <span className="capitalize">{r.match_status}</span>
                </p>
              </div>
              <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-semibold text-ink-700">
                {REPORT_STATUS_LABELS[r.status]}
              </span>
            </button>
          ))}
        </div>
      )}

      <ReportDetailModal
        reportId={openReportId}
        onClose={() => setOpenReportId(null)}
        onChanged={invalidateAll}
      />
    </div>
  );
}

function ReportDetailModal({ reportId, onClose, onChanged }) {
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-report-detail', reportId],
    queryFn: () => getReportDetail(reportId),
    enabled: reportId !== null,
  });

  const reviewMutation = useMutation({
    mutationFn: () => reviewReport(reportId),
    onSuccess: () => { toast.success('Marked as under review'); onChanged(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not update report'),
  });

  if (reportId === null) return null;

  const report = data?.report;
  const evidence = data?.evidence;

  return (
    <>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4 py-8 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl rounded-3xl border border-forest-100 bg-cream-50 p-6 shadow-xl"
        >
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-lg font-semibold text-forest-950">
              Report {report ? `#${report.report_id}` : ''}
            </h3>
            <button onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-forest-100 hover:text-ink-700">
              <X size={18} />
            </button>
          </div>

          {isLoading || !report ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : (
            <>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-semibold text-ink-700">
                  {REPORT_STATUS_LABELS[report.status]}
                </span>
                <span className="text-xs text-ink-400">Match #{report.match_id} ({report.match_status})</span>
              </div>

              <p className="mt-3 text-sm text-ink-600">
                <span className="font-semibold text-forest-900">{report.reporter_name}</span> reported{' '}
                <span className="font-semibold text-forest-900">{report.reported_name}</span> for{' '}
                <span className="capitalize">{report.reason.replace(/_/g, ' ')}</span>
              </p>
              <p className="mt-2 rounded-xl bg-white p-3 text-sm text-ink-700">{report.description}</p>

              {evidence?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Evidence</p>
                  <div className="flex flex-wrap gap-2">
                    {evidence.map((e) => (
                      <a
                        key={e.evidence_id}
                        href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${e.file_url}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-forest-100 bg-white px-3 py-1.5 text-xs font-semibold text-forest-800 hover:border-forest-700"
                      >
                        <FileText size={13} /> {e.original_filename || 'File'}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-xl bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Explanation</p>
                {report.explanation ? (
                  <p className="mt-1.5 text-sm text-ink-700">{report.explanation}</p>
                ) : report.status === 'explanation_requested' ? (
                  <p className="mt-1.5 text-xs text-amber-700">
                    Requested {new Date(report.explanation_requested_at).toLocaleString()} · deadline{' '}
                    {new Date(report.explanation_deadline).toLocaleString()}
                    {new Date(report.explanation_deadline) < new Date() && (
                      <span className="ml-1 font-semibold text-red-600">— deadline passed, no response</span>
                    )}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-ink-400">Not requested yet.</p>
                )}
              </div>

              {(report.status === 'resolved' || report.status === 'dismissed') && (
                <div className="mt-4 rounded-xl bg-forest-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-forest-700">Admin decision</p>
                  <p className="mt-1 text-sm capitalize text-forest-900">{report.resolution_action?.replace(/_/g, ' ')}</p>
                  <p className="mt-1 text-sm text-ink-600">{report.resolution_note}</p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2 border-t border-forest-100 pt-4">
                {report.status === 'pending' && (
                  <button
                    onClick={() => reviewMutation.mutate()}
                    disabled={reviewMutation.isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-forest-900 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
                  >
                    <AlertTriangle size={15} /> Start review
                  </button>
                )}
                {['pending', 'under_review'].includes(report.status) && (
                  <button
                    onClick={() => setShowExplainModal(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
                  >
                    <MessageSquareWarning size={15} /> Request explanation
                  </button>
                )}
                {!['resolved', 'dismissed'].includes(report.status) && (
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    <CheckCircle2 size={15} /> Resolve
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>

      <RequestExplanationModal
        open={showExplainModal}
        reportId={reportId}
        onClose={() => setShowExplainModal(false)}
        onDone={() => { setShowExplainModal(false); onChanged(); }}
      />
      <ResolveReportModal
        open={showResolveModal}
        reportId={reportId}
        onClose={() => setShowResolveModal(false)}
        onDone={() => { setShowResolveModal(false); onClose(); onChanged(); }}
      />
    </AnimatePresence>
    </>
  );
}

function RequestExplanationModal({ open, reportId, onClose, onDone }) {
  const [hours, setHours] = useState(48);

  const mutation = useMutation({
    mutationFn: () => requestExplanation(reportId, hours),
    onSuccess: (d) => { toast.success(d.message || 'Explanation requested'); onDone(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not request explanation'),
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/40 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl border border-forest-100 bg-cream-50 p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-lg font-semibold text-forest-950">Request an explanation?</h3>
              <button onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-forest-100 hover:text-ink-700">
                <X size={18} />
              </button>
            </div>
            <p className="mt-1.5 text-sm text-ink-600">
              The reported user will be notified and given a deadline to respond.
            </p>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-400">Deadline (hours)</label>
            <input
              type="number"
              min={1}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-xl border border-forest-100 px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-white">
                Cancel
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || hours < 1}
                className="rounded-xl bg-forest-900 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
              >
                {mutation.isPending ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ResolveReportModal({ open, reportId, onClose, onDone }) {
  const [action, setAction] = useState('dismiss');
  const [note, setNote] = useState('');
  const [suspensionDays, setSuspensionDays] = useState(7);

  useEffect(() => {
    if (open) { setAction('dismiss'); setNote(''); setSuspensionDays(7); }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => resolveReport(reportId, { action, note, suspensionDays: action === 'temporary_suspension' ? suspensionDays : undefined }),
    onSuccess: (d) => { toast.success(d.message || 'Report resolved'); onDone(); },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not resolve report'),
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/40 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-forest-100 bg-cream-50 p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-lg font-semibold text-forest-950">Resolve this report</h3>
              <button onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-forest-100 hover:text-ink-700">
                <X size={18} />
              </button>
            </div>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-400">Action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
            >
              <option value="dismiss">Dismiss</option>
              <option value="warning">Issue warning</option>
              <option value="temporary_suspension">Temporary suspension</option>
              <option value="permanent_suspension">Permanent suspension</option>
              <option value="account_deletion">Delete account</option>
            </select>

            {action === 'temporary_suspension' && (
              <>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-400">Duration (days)</label>
                <input
                  type="number"
                  min={1}
                  value={suspensionDays}
                  onChange={(e) => setSuspensionDays(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
                />
              </>
            )}

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-400">Decision note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Explain the reasoning behind this decision, for the audit record…"
              className="mt-1.5 w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-xl border border-forest-100 px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-white">
                Cancel
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !note.trim()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-red-700 disabled:opacity-60"
              >
                {mutation.isPending ? 'Resolving…' : 'Confirm decision'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}