import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitReview } from '@/services/studentService';
import StarRatingInput from '@/components/shared/StarRatingInput';

export default function WriteReview() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rating) {
      toast.error('Please choose a star rating.');
      return;
    }
    setSaving(true);
    try {
      await submitReview({ matchId, rating, comment });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not submit review');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center rounded-3xl border border-forest-100 bg-cream-50 p-10 text-center"
          >
            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600"
            >
              <PartyPopper size={28} />
            </motion.div>
            <h1 className="mt-5 font-display text-2xl font-semibold text-forest-950">
              Thanks for the feedback!
            </h1>
            <p className="mt-2 text-sm text-ink-600">Your review helps other students find great tutors.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-7 rounded-full bg-forest-900 px-7 py-3 font-semibold text-cream-50 hover:bg-forest-800"
            >
              Back to dashboard
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <h1 className="font-display text-3xl font-semibold text-forest-950">Rate your tutor</h1>
            <p className="mt-2 text-ink-600">How was your experience? Your review is tied to this specific match.</p>

            <form onSubmit={handleSubmit} className="mt-8 rounded-3xl border border-forest-100 bg-cream-50 p-8">
              <label className="mb-3 block text-sm font-semibold text-forest-900">Your rating</label>
              <StarRatingInput value={rating} onChange={setRating} />

              <label className="mb-1.5 mt-7 block text-sm font-semibold text-forest-900">
                Comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="What went well? What could improve?"
                className="w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
              />

              <button
                type="submit"
                disabled={saving}
                className="mt-6 w-full rounded-xl bg-forest-900 py-3 font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
              >
                {saving ? 'Submitting…' : 'Submit review'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}