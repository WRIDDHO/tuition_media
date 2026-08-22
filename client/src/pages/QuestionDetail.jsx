import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { getQuestionById, createAnswer, acceptAnswer } from '@/services/activityService';
import { useAuth } from '@/context/AuthContext';
import { Spinner, SubjectPill } from '@/components/shared/Primitives';

export default function QuestionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [answerText, setAnswerText] = useState('');

  const { data: question, isLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => getQuestionById(id),
  });

  const answerMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('body', answerText);
      return createAnswer(id, fd);
    },
    onSuccess: () => {
      toast.success('Answer posted');
      setAnswerText('');
      queryClient.invalidateQueries({ queryKey: ['question', id] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to post answer'),
  });

  const acceptMutation = useMutation({
    mutationFn: (answerId) => acceptAnswer(answerId),
    onSuccess: () => {
      toast.success('Marked as accepted');
      queryClient.invalidateQueries({ queryKey: ['question', id] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not accept this answer'),
  });

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;
  if (!question) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <SubjectPill>{question.subject_name}</SubjectPill>
        <h1 className="mt-3 font-display text-3xl font-semibold text-forest-950">{question.title}</h1>
        <p className="mt-2 text-xs text-ink-400">Asked by {question.asked_by}</p>
        {question.body && <p className="mt-5 text-ink-700">{question.body}</p>}
        {question.image_url && (
          <img
            src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${question.image_url}`}
            alt="Question attachment"
            className="mt-5 max-h-96 rounded-2xl border border-forest-100 object-contain"
          />
        )}
      </motion.div>

      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold text-forest-950">
          {question.answers?.length ?? 0} Answer{question.answers?.length === 1 ? '' : 's'}
        </h2>

        <div className="mt-4 space-y-4">
          {question.answers?.map((a) => (
            <div
              key={a.answer_id}
              className={`rounded-2xl border p-5 ${
                a.is_accepted ? 'border-forest-700 bg-forest-50' : 'border-forest-100 bg-cream-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-forest-900">{a.answered_by}</p>
                {a.is_accepted && (
                  <span className="flex items-center gap-1 rounded-full bg-forest-700 px-2.5 py-0.5 text-xs font-semibold text-cream-50">
                    <CheckCircle2 size={13} /> Accepted
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-ink-700">{a.body}</p>
              {!a.is_accepted && (
                <button
                  onClick={() => acceptMutation.mutate(a.answer_id)}
                  className="mt-3 text-xs font-semibold text-forest-700 ink-underline"
                >
                  Mark as accepted answer
                </button>
              )}
            </div>
          ))}
        </div>

        {user && (
          <form
            onSubmit={(e) => { e.preventDefault(); if (answerText.trim()) answerMutation.mutate(); }}
            className="mt-8 rounded-2xl border border-forest-100 bg-cream-50 p-5"
          >
            <label className="mb-2 block text-sm font-semibold text-forest-900">Your answer</label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
              placeholder="Explain your solution…"
            />
            <button
              type="submit"
              disabled={answerMutation.isPending}
              className="mt-3 flex items-center gap-2 rounded-full bg-forest-900 px-6 py-2.5 text-sm font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
            >
              <Send size={15} /> {answerMutation.isPending ? 'Posting…' : 'Post answer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
