import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllSubjects } from '@/services/studentService';
import { createQuestion } from '@/services/activityService';

export default function AskQuestion() {
  const navigate = useNavigate();
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState(null);

  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: getAllSubjects });

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('subjectId', subjectId);
      fd.append('title', title);
      if (body) fd.append('body', body);
      if (image) fd.append('image', image);
      return createQuestion(fd);
    },
    onSuccess: (q) => {
      toast.success('Question posted!');
      navigate(`/questions/${q.question_id}`);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to post question'),
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!subjectId || !title || (!body && !image)) {
      toast.error('Subject, title, and either a description or image are required.');
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold text-forest-950">Ask a Question</h1>
        <p className="mt-2 text-ink-600">Be specific — the clearer the question, the faster the answer.</p>

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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Attach an image (optional)</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-forest-100 px-4 py-3 text-sm text-ink-600 hover:border-forest-700">
              <ImagePlus size={17} />
              {image ? image.name : 'Choose an image'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-forest-900 py-3 font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
          >
            {mutation.isPending ? 'Posting…' : 'Post question'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
