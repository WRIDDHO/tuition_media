import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Send, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getQuestionById, createAnswer, acceptAnswer,
  deleteQuestion, updateAnswer, deleteAnswer,
} from '@/services/activityService';
import { useAuth } from '@/context/AuthContext';
import { Spinner, SubjectPill } from '@/components/shared/Primitives';

export default function QuestionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answerText, setAnswerText] = useState('');
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editingAnswerText, setEditingAnswerText] = useState('');

  const { data: question, isLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => getQuestionById(id),
  });

  const isAsker = question && user?.userId === question.user_id;
  const isAdmin = user?.role === 'admin';

  function invalidateQuestion() {
    queryClient.invalidateQueries({ queryKey: ['question', id] });
  }

  const answerMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('body', answerText);
      return createAnswer(id, fd);
    },
    onSuccess: () => {
      toast.success('Answer posted');
      setAnswerText('');
      invalidateQuestion();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to post answer'),
  });

  const acceptMutation = useMutation({
    mutationFn: (answerId) => acceptAnswer(answerId),
    onSuccess: () => {
      toast.success('Marked as accepted');
      invalidateQuestion();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not accept this answer'),
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: () => deleteQuestion(id),
    onSuccess: () => {
      toast.success('Question deleted');
      navigate('/questions');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not delete question'),
  });

  const updateAnswerMutation = useMutation({
    mutationFn: ({ answerId, body }) => updateAnswer(answerId, { body }),
    onSuccess: () => {
      toast.success('Answer updated');
      setEditingAnswerId(null);
      invalidateQuestion();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not update answer'),
  });

  const deleteAnswerMutation = useMutation({
    mutationFn: (answerId) => deleteAnswer(answerId),
    onSuccess: () => {
      toast.success('Answer deleted');
      invalidateQuestion();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not delete answer'),
  });

  function handleDeleteQuestion() {
    if (!window.confirm('Delete this question? All its answers will be removed too.')) return;
    deleteQuestionMutation.mutate();
  }

  function handleDeleteAnswer(answerId) {
    if (!window.confirm('Delete this answer?')) return;
    deleteAnswerMutation.mutate(answerId);
  }

  function startEditingAnswer(a) {
    setEditingAnswerId(a.answer_id);
    setEditingAnswerText(a.body || '');
  }

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;
  if (!question) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SubjectPill>{question.subject_name}</SubjectPill>
            {question.status === 'solved' && (
              <span className="flex items-center gap-1 rounded-full bg-forest-700 px-2.5 py-0.5 text-xs font-semibold text-cream-50">
                <CheckCircle2 size={12} /> Solved
              </span>
            )}
          </div>
          {(isAsker || isAdmin) && (
            <div className="flex gap-2">
              {isAsker && (
                <Link
                  to={`/questions/${id}/edit`}
                  className="flex items-center gap-1.5 rounded-xl border border-forest-200 px-3 py-1.5 text-xs font-semibold text-forest-800 hover:bg-forest-50"
                >
                  <Pencil size={14} /> Edit
                </Link>
              )}
              <button
                onClick={handleDeleteQuestion}
                disabled={deleteQuestionMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 size={14} /> {isAdmin && !isAsker ? 'Remove' : 'Delete'}
              </button>
            </div>
          )}
        </div>
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
          {question.answers?.map((a) => {
            const isAnswerOwner = user?.userId === a.answered_by_user_id;
            const isEditingThis = editingAnswerId === a.answer_id;
            return (
              <div
                key={a.answer_id}
                className={`rounded-2xl border p-5 ${
                  a.is_accepted ? 'border-forest-700 bg-forest-50' : 'border-forest-100 bg-cream-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-forest-900">{a.answered_by}</p>
                  <div className="flex items-center gap-2">
                    {a.is_accepted && (
                      <span className="flex items-center gap-1 rounded-full bg-forest-700 px-2.5 py-0.5 text-xs font-semibold text-cream-50">
                        <CheckCircle2 size={13} /> Accepted
                      </span>
                    )}
                    {(isAnswerOwner || isAdmin) && !isEditingThis && (
                      <div className="flex gap-1.5">
                        {isAnswerOwner && (
                          <button
                            onClick={() => startEditingAnswer(a)}
                            className="rounded-lg p-1 text-ink-400 hover:bg-white hover:text-forest-700"
                            title="Edit answer"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAnswer(a.answer_id)}
                          disabled={deleteAnswerMutation.isPending}
                          className="rounded-lg p-1 text-ink-400 hover:bg-white hover:text-red-600"
                          title={isAdmin && !isAnswerOwner ? 'Remove answer' : 'Delete answer'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditingThis ? (
                  <div className="mt-2">
                    <textarea
                      value={editingAnswerText}
                      onChange={(e) => setEditingAnswerText(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => updateAnswerMutation.mutate({ answerId: a.answer_id, body: editingAnswerText })}
                        disabled={updateAnswerMutation.isPending || !editingAnswerText.trim()}
                        className="rounded-full bg-forest-900 px-4 py-1.5 text-xs font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingAnswerId(null)}
                        className="rounded-full border border-forest-100 px-4 py-1.5 text-xs font-semibold text-ink-600 hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-ink-700">{a.body}</p>
                )}

                {isAsker && !a.is_accepted && !isEditingThis && (
                  <button
                    onClick={() => acceptMutation.mutate(a.answer_id)}
                    disabled={acceptMutation.isPending}
                    className="mt-3 text-xs font-semibold text-forest-700 ink-underline"
                  >
                    Mark as accepted answer
                  </button>
                )}
              </div>
            );
          })}
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
