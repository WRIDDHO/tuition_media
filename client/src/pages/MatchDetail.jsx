import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Wallet, MapPin, Calendar, Clock, X, Flag, Ban, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMatchById, cancelMatch } from '@/services/matchService';
import { createReport, REPORT_REASONS } from '@/services/reportService';
import { Spinner, SubjectPill } from '@/components/shared/Primitives';

// Shared shell for the two modals below -- everything specific to
// "cancel" vs "report" lives in the two components that use it.
function ActionModal({ open, title, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-forest-100 bg-cream-50 p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-lg font-semibold text-forest-950">{title}</h3>
              <button onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-forest-100 hover:text-ink-700">
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CancelMatchModal({ open, onClose, matchId }) {
  const [reason, setReason] = useState('');
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => cancelMatch(matchId, reason),
    onSuccess: () => {
      toast.success('Match cancelled');
      onClose();
      navigate('/matches');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not cancel this match'),
  });

  return (
    <ActionModal open={open} onClose={onClose} title="Cancel this match?">
      <p className="mt-1.5 text-sm text-ink-600">The other participant will be notified.</p>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-400">Reason</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Why is this match being cancelled?"
        className="mt-1.5 w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
      />
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-forest-100 px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-white">
          Never mind
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !reason.trim()}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-red-700 disabled:opacity-60"
        >
          {mutation.isPending ? 'Cancelling…' : 'Confirm cancellation'}
        </button>
      </div>
    </ActionModal>
  );
}

function ReportModal({ open, onClose, matchId, reportedLabel }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);

  const mutation = useMutation({
    mutationFn: () => createReport({ matchId, reason, description, evidenceFiles: files }),
    onSuccess: () => {
      toast.success('Report submitted. An admin will review it.');
      onClose();
      setReason(''); setDescription(''); setFiles([]);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not submit report'),
  });

  return (
    <ActionModal open={open} onClose={onClose} title={`Report ${reportedLabel}`}>
      <p className="mt-1.5 text-sm text-ink-600">
        This goes to an admin for investigation -- it does not suspend or punish anyone automatically.
      </p>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-400">Reason</label>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
      >
        <option value="">Select a reason…</option>
        {REPORT_REASONS.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink-400">Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        placeholder="What happened, with as much detail as you can give…"
        className="mt-1.5 w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
      />

      <label className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
        <Upload size={13} /> Evidence (optional, up to 5 files)
      </label>
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))}
        className="mt-1.5 w-full text-sm text-ink-600"
      />

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-xl border border-forest-100 px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-white">
          Cancel
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !reason || !description.trim()}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-cream-50 hover:bg-red-700 disabled:opacity-60"
        >
          {mutation.isPending ? 'Submitting…' : 'Submit report'}
        </button>
      </div>
    </ActionModal>
  );
}

export default function MatchDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [modal, setModal] = useState(null); // null | 'cancel' | 'report'

  const { data: match, isLoading, isError } = useQuery({
    queryKey: ['match', id],
    queryFn: () => getMatchById(id),
  });

  if (isLoading) return <div className="flex min-h-[50vh] items-center justify-center"><Spinner /></div>;
  if (isError || !match) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="font-display text-xl font-semibold text-forest-950">Match not found</p>
        <Link to="/matches" className="mt-5 inline-block rounded-full bg-forest-900 px-5 py-2.5 text-sm font-semibold text-cream-50 hover:bg-forest-800">
          Back to My Matches
        </Link>
      </div>
    );
  }

  const isTeacher = user?.userId === match.teacher_user_id;
  const otherName = isTeacher ? match.student_name : match.teacher_name;
  const otherRoleLabel = isTeacher ? 'Student' : 'Teacher';

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-forest-100 bg-cream-50 p-8">
        <div className="flex items-center gap-2">
          {match.subject_name && <SubjectPill>{match.subject_name}</SubjectPill>}
          <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-semibold text-ink-700 capitalize">{match.status}</span>
        </div>

        <h1 className="mt-4 font-display text-2xl font-semibold text-forest-950">
          {otherRoleLabel}: {otherName}
        </h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {match.location && (
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 text-forest-700" />
              <div><p className="text-xs text-ink-400">Location</p><p className="text-sm font-medium text-ink-900">{match.location}</p></div>
            </div>
          )}
          {match.mode && (
            <div className="flex items-start gap-2.5">
              <Clock size={16} className="mt-0.5 text-forest-700" />
              <div><p className="text-xs text-ink-400">Mode</p><p className="text-sm font-medium text-ink-900 capitalize">{match.mode}</p></div>
            </div>
          )}
          {match.rate && (
            <div className="flex items-start gap-2.5">
              <Wallet size={16} className="mt-0.5 text-forest-700" />
              <div><p className="text-xs text-ink-400">Rate</p><p className="text-sm font-medium text-ink-900">৳{match.rate}</p></div>
            </div>
          )}
          <div className="flex items-start gap-2.5">
            <Calendar size={16} className="mt-0.5 text-forest-700" />
            <div><p className="text-xs text-ink-400">Started</p><p className="text-sm font-medium text-ink-900">{new Date(match.started_at).toLocaleDateString()}</p></div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-forest-100 pt-6">
          {match.status === 'active' && (
            <button
              onClick={() => setModal('cancel')}
              className="flex items-center gap-1.5 rounded-xl border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
            >
              <Ban size={15} /> Cancel match
            </button>
          )}
          <button
            onClick={() => setModal('report')}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <Flag size={15} /> Report {otherRoleLabel.toLowerCase()}
          </button>
          <Link
            to="/reports"
            className="ml-auto text-sm font-semibold text-forest-700 ink-underline"
          >
            My reports
          </Link>
        </div>
      </motion.div>

      <CancelMatchModal open={modal === 'cancel'} onClose={() => setModal(null)} matchId={id} />
      <ReportModal open={modal === 'report'} onClose={() => setModal(null)} matchId={id} reportedLabel={otherRoleLabel.toLowerCase()} />
    </div>
  );
}