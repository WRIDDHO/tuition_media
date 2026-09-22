import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Briefcase, Phone, GraduationCap, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTeacherById } from '@/services/teacherService';
import { getReviewsForTeacher, updateReview, deleteReview } from '@/services/studentService';
import { useAuth } from '@/context/AuthContext';
import { RatingStars, Spinner, EmptyState } from '@/components/shared/Primitives';

export default function TeacherProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', id],
    queryFn: () => getTeacherById(id),
  });

  const { data: reviewData } = useQuery({
    queryKey: ['teacher-reviews', id],
    queryFn: () => getReviewsForTeacher(id),
    enabled: !!id,
  });

  function invalidateReviews() {
    queryClient.invalidateQueries({ queryKey: ['teacher-reviews', id] });
    queryClient.invalidateQueries({ queryKey: ['teacher', id] });
  }

  const updateMutation = useMutation({
    mutationFn: ({ reviewId, rating, comment }) => updateReview(reviewId, { rating, comment }),
    onSuccess: () => {
      toast.success('Review updated');
      setEditingReviewId(null);
      invalidateReviews();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not update review'),
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId) => deleteReview(reviewId),
    onSuccess: () => {
      toast.success('Review deleted');
      invalidateReviews();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not delete review'),
  });

  function startEditing(r) {
    setEditingReviewId(r.review_id);
    setEditRating(r.rating);
    setEditComment(r.comment || '');
  }

  function handleDelete(reviewId) {
    if (!window.confirm('Delete your review? This cannot be undone.')) return;
    deleteMutation.mutate(reviewId);
  }

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;
  }

  if (!teacher) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <EmptyState title="Teacher not found" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl border border-forest-100 bg-cream-50"
      >
        <div className="h-28 bg-gradient-to-r from-forest-800 to-forest-600" />
        <div className="px-8 pb-8">
          <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-cream-50 bg-forest-900 font-display text-3xl font-semibold text-cream-50 shadow-md">
                {teacher.full_name?.[0]}
              </div>
              <div className="pb-1">
                <h1 className="font-display text-2xl font-semibold text-forest-950">{teacher.full_name}</h1>
                <div className="mt-1 flex items-center gap-2">
                  <RatingStars rating={teacher.avg_rating} />
                  <span className="text-sm text-ink-400">
                    {teacher.avg_rating} ({teacher.total_reviews ?? 0} reviews)
                  </span>
                </div>
              </div>
            </div>
            {teacher.hourly_rate && (
              <div className="rounded-2xl bg-forest-100 px-5 py-3 text-center">
                <p className="font-display text-2xl font-semibold text-forest-900">৳{teacher.hourly_rate}</p>
                <p className="text-xs text-ink-600">per hour</p>
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <InfoRow icon={GraduationCap} label="Qualification" value={teacher.qualification} />
            <InfoRow icon={Briefcase} label="Institution" value={teacher.institution} />
            <InfoRow icon={Briefcase} label="Experience" value={teacher.experience_years ? `${teacher.experience_years} years` : null} />
            <InfoRow icon={MapPin} label="Location" value={[teacher.area, teacher.district].filter(Boolean).join(', ')} />
            {teacher.phone && <InfoRow icon={Phone} label="Phone" value={teacher.phone} />}
          </div>
        </div>
      </motion.div>

      {/* Reviews */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-forest-950">Reviews</h2>
        {!reviewData?.reviews?.length ? (
          <p className="mt-4 text-sm text-ink-600">No reviews yet.</p>
        ) : (
          <div className="mt-5 space-y-4">
            {reviewData.reviews.map((r) => {
              const isOwner = user?.userId === r.reviewer_user_id;
              const isEditingThis = editingReviewId === r.review_id;
              return (
                <div key={r.review_id} className="rounded-2xl border border-forest-100 bg-cream-50 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-forest-900">{r.reviewer_name}</p>
                    <div className="flex items-center gap-2">
                      {!isEditingThis && <RatingStars rating={r.rating} size={13} />}
                      {isOwner && !isEditingThis && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditing(r)}
                            className="rounded-lg p-1 text-ink-400 hover:bg-white hover:text-forest-700"
                            aria-label="Edit review"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.review_id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-lg p-1 text-ink-400 hover:bg-white hover:text-red-600"
                            aria-label="Delete review"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditingThis ? (
                    <div className="mt-3 space-y-2">
                      <select
                        value={editRating}
                        onChange={(e) => setEditRating(Number(e.target.value))}
                        className="rounded-lg border border-forest-100 bg-white px-3 py-1.5 text-sm outline-none focus:border-forest-700"
                      >
                        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>)}
                      </select>
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-forest-100 bg-white p-2 text-sm outline-none focus:border-forest-700"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateMutation.mutate({ reviewId: r.review_id, rating: editRating, comment: editComment })}
                          disabled={updateMutation.isPending}
                          className="rounded-full bg-forest-900 px-4 py-1.5 text-xs font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingReviewId(null)}
                          className="rounded-full border border-forest-100 px-4 py-1.5 text-xs font-semibold text-ink-600 hover:bg-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    r.comment && <p className="mt-2 text-sm text-ink-600">{r.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/60 p-3">
      <Icon size={17} className="mt-0.5 shrink-0 text-forest-700" />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
        <p className="text-sm font-medium text-ink-900">{value}</p>
      </div>
    </div>
  );
}
