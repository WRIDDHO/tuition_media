import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllSubjects } from '@/services/studentService';
import { createQuestion, getQuestionById, updateQuestion } from '@/services/activityService';
import { Spinner } from '@/components/shared/Primitives';

export default function AskQuestion() {
  const navigate = useNavigate();
  const { id } = useParams(); // present only on /questions/:id/edit
  const isEditing = !!id;

  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: getAllSubjects });
  const { data: existingQuestion, isLoading: loadingQuestion } = useQuery({
    queryKey: ['question', id],
    queryFn: () => getQuestionById(id),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!existingQuestion) return;
    setSubjectId(existingQuestion.subject_id ?? '');
    setTitle(existingQuestion.title ?? '');
    setBody(existingQuestion.body ?? '');
    setExistingImageUrl(existingQuestion.image_url ?? null);
  }, [existingQuestion]);

  const mutation = useMutation({
    mutationFn: () => {
      if (isEditing) {
        // Editing stays text-only for simplicity -- the existing image (if
        // any) is preserved as-is; replacing it isn't supported here.
        return updateQuestion(id, { subjectId, title, body, imageUrl: existingImageUrl });
      }
      const fd = new FormData();
      fd.append('subjectId', subjectId);
      fd.append('title', title);
      if (body) fd.append('body', body);
      if (image) fd.append('image', image);
      return createQuestion(fd);
    },
    onSuccess: (q) => {
      toast.success(isEditing ? 'Question updated!' : 'Question posted!');
      navigate(`/questions/${isEditing ? id : q.question_id}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || (isEditing ? 'Failed to update question' : 'Failed to post question')),
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!subjectId || !title || (!body && !image && !existingImageUrl)) {
      toast.error('Subject, title, and either a description or image are required.');
      return;
    }
    mutation.mutate();
  }

  if (isEditing && loadingQuestion) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold text-forest-950">
          {isEditing ? 'Edit Question' : 'Ask a Question'}
        </h1>
        <p className="mt-2 text-ink-600">
          {isEditing ? 'Update your question below.' : 'Be specific — the clearer the question, the faster the answer.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-3xl border border-forest-100 bg-cream-50 p-7">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
            >
              <option value="">Select a subject</option>
              {subjects?.map((s) => (
                <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
              placeholder="e.g. How do I integrate by parts here?"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Description (optional if you attach an image)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
              placeholder="Explain what you've tried so far…"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-900">Attach an image (optional)</label>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-forest-100 px-4 py-3 text-sm text-ink-600 hover:border-forest-700">
                <ImagePlus size={17} />
                {image ? image.name : 'Choose an image'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          )}
          {isEditing && existingImageUrl && (
            <p className="text-xs text-ink-400">This question has an attached image. Delete and re-post to change it.</p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-forest-900 py-3 font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
          >
            {mutation.isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Post question'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
