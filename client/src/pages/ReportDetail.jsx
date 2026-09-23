import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FileText, Send } from 'lucide-react';
import { getReportById, submitExplanation } from '@/services/reportService';
import { Spinner } from '@/components/shared/Primitives';

const STATUS_LABELS = {
  pending: 'Pending', under_review: 'Under review',
  explanation_requested: 'Explanation requested', explanation_received: 'Explanation received',
  resolved: 'Resolved', dismissed: 'Dismissed',
};

export default function ReportDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [explanation, setExplanation] = useState('');
  const [files, setFiles] = useState([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['report', id],
    queryFn: () => getReportById(id),
  });

  const mutation = useMutation({
    mutationFn: () => submitExplanation(id, { explanation, evidenceFiles: files }),
    onSuccess: () => {
      toast.success('Explanation submitted');
      queryClient.invalidateQueries({ queryKey: ['report', id] });
      queryClient.invalidateQueries({ queryKey: ['reports-about-me'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not submit explanation'),
  });

  if (isLoading) return <div className="flex min-h-[50vh] items-center justify-center"><Spinner /></div>;
  if (isError || !data) {
    return <p className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-red-700">Report not found.</p>;
  }

  const { report, evidence } = data;
  // FIXED: was a fragile full-name string comparison, and wasn't even
  // used to gate the form -- the reporter could see the "submit
  // explanation" textarea too. viewerRole is computed server-side by
  // report.controller.js from the real reported_user_id, so this is
  // authoritative (the backend procedure still enforces it either way).
  const canExplain = report.viewerRole === 'reported' && report.status === 'explanation_requested';

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-forest-100 bg-cream-50 p-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-ink-400">Report #{report.report_id}</p>
          <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-semibold text-ink-700">
            {STATUS_LABELS[report.status]}
          </span>
        </div>

        <h1 className="mt-3 font-display text-xl font-semibold text-forest-950 capitalize">
          {report.reason.replace(/_/g, ' ')}
        </h1>
        <p className="mt-2 text-sm text-ink-600">{report.description}</p>
        <p className="mt-3 text-xs text-ink-400">
          Reported by {report.reporter_name} on {new Date(report.created_at).toLocaleDateString()}
        </p>

        {evidence?.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Evidence</p>
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

        <div className="mt-8 border-t border-forest-100 pt-6">
          <p className="text-sm font-semibold text-forest-900">Explanation</p>
          {report.explanation ? (
            <p className="mt-2 text-sm text-ink-700">{report.explanation}</p>
          ) : canExplain ? (
            <>
              <p className="mt-1 text-xs text-ink-500">
                Deadline: {new Date(report.explanation_deadline).toLocaleString()}
              </p>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={5}
                placeholder="Explain your side of this report…"
                className="mt-3 w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
              />
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))}
                className="mt-2 w-full text-sm text-ink-600"
              />
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !explanation.trim()}
                className="mt-3 flex items-center gap-2 rounded-full bg-forest-900 px-6 py-2.5 text-sm font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
              >
                <Send size={15} /> {mutation.isPending ? 'Submitting…' : 'Submit explanation'}
              </button>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-400">No explanation has been requested yet.</p>
          )}
        </div>

        {report.status === 'resolved' || report.status === 'dismissed' ? (
          <div className="mt-6 rounded-xl bg-forest-50 p-4">
            <p className="text-sm font-semibold text-forest-900">This case is closed.</p>
            <p className="mt-1 text-xs text-ink-500">Resolved {new Date(report.resolved_at).toLocaleDateString()}</p>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}