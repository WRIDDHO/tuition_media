import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, CheckCircle2 } from 'lucide-react';
import { getAllQuestions } from '@/services/activityService';
import { StaggerGrid, StaggerItem } from '@/components/shared/StaggerGrid';
import { SubjectPill, EmptyState, Spinner } from '@/components/shared/Primitives';

export default function Questions() {
  const { data: questions, isLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: () => getAllQuestions(),
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-forest-950">Q&amp;A Community</h1>
          <p className="mt-2 text-ink-600">Stuck on something? Ask, and a tutor will answer.</p>
        </div>
        <Link
          to="/questions/new"
          className="rounded-full bg-forest-900 px-6 py-3 text-sm font-semibold text-cream-50 hover:bg-forest-800"
        >
          Ask a question
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : !questions?.length ? (
        <EmptyState title="No questions yet" description="Be the first to ask." />
      ) : (
        <StaggerGrid className="space-y-4">
          {questions.map((q) => (
            <StaggerItem key={q.question_id}>
              <Link
                to={`/questions/${q.question_id}`}
                className="flex items-start gap-4 rounded-2xl border border-forest-100 bg-cream-50 p-5 transition hover:border-forest-700 hover:shadow-md"
              >
                <div className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  q.status === 'solved' ? 'bg-forest-100 text-forest-700' : 'bg-amber-100 text-amber-600'
                }`}>
                  {q.status === 'solved' ? <CheckCircle2 size={18} /> : <MessageCircle size={18} />}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SubjectPill>{q.subject_name}</SubjectPill>
                    <span className={`text-xs font-semibold ${q.status === 'solved' ? 'text-forest-700' : 'text-amber-600'}`}>
                      {q.status === 'solved' ? 'Solved' : 'Unsolved'}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-forest-950">{q.title}</h3>
                  <p className="mt-1 text-xs text-ink-400">
                    Asked by {q.asked_by} · {q.answer_count ?? 0} answer{q.answer_count === 1 ? '' : 's'}
                  </p>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}
    </div>
  );
}
