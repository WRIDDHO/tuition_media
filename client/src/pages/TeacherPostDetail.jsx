import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Wallet, MapPin, Users, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTeacherPostById } from '@/services/postService';
import { applyToPost, getApplicationsForPost, acceptApplication } from '@/services/activityService';
import { useAuth } from '@/context/AuthContext';
import { Spinner, SubjectPill } from '@/components/shared/Primitives';

export default function TeacherPostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ['teacher-post', id],
    queryFn: () => getTeacherPostById(id),
  });

  const applyMutation = useMutation({
    mutationFn: () => applyToPost(id),
    onSuccess: () => toast.success('Application sent!'),
    onError: (err) => toast.error(err.response?.data?.error || 'Could not apply'),
  });

  // Only relevant if the logged-in user owns this post — the request itself
  // is safe to fire either way, the backend enforces ownership and will
  // just 403 for non-owners, which we quietly ignore here.
  const { data: applicants } = useQuery({
    queryKey: ['post-applicants', id],
    queryFn: () => getApplicationsForPost(id),
    enabled: !!user && user.role === 'teacher',
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: (applicationId) => acceptApplication(applicationId),
    onSuccess: () => {
      toast.success('Application accepted — match created!');
      queryClient.invalidateQueries({ queryKey: ['post-applicants', id] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not accept'),
  });

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;
  if (!post) return null;

  const rows = [
    { icon: Calendar, label: 'Days per week', value: post.days_per_week },
    { icon: Clock, label: 'Preferred time', value: post.preferred_time },
    { icon: MapPin, label: 'Location', value: post.location },
    { icon: Users, label: 'Vacancy', value: post.vacancy },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-forest-100 bg-cream-50 p-8">
        <div className="flex flex-wrap items-center gap-3">
          <SubjectPill>{post.subject_name}</SubjectPill>
          {post.class_level && (
            <span className="rounded-full bg-forest-950 px-3 py-1 text-xs font-semibold text-cream-50">{post.class_level}</span>
          )}
        </div>

        <h1 className="mt-4 font-display text-3xl font-semibold text-forest-950">{post.title}</h1>
        <p className="mt-3 text-ink-600">{post.description}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {rows.filter((r) => r.value).map((r) => (
            <div key={r.label} className="flex items-start gap-3 rounded-xl bg-white/60 p-3">
              <r.icon size={17} className="mt-0.5 shrink-0 text-forest-700" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{r.label}</p>
                <p className="text-sm font-medium text-ink-900">{r.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between rounded-2xl bg-forest-100 p-5">
          <div>
            {post.expected_salary && (
              <p className="flex items-center gap-1.5 font-display text-2xl font-semibold text-forest-900">
                <Wallet size={20} className="text-amber-600" /> ৳{post.expected_salary}
              </p>
            )}
            <p className="text-sm text-ink-600">Posted by {post.teacher_name}</p>
          </div>

          {user?.role === 'student' && (
            <button
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending || applyMutation.isSuccess}
              className="rounded-full bg-forest-900 px-7 py-3 font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
            >
              {applyMutation.isSuccess ? 'Applied ✓' : applyMutation.isPending ? 'Applying…' : 'Apply Now'}
            </button>
          )}
          {!user && (
            <a href="/login" className="rounded-full bg-forest-900 px-7 py-3 font-semibold text-cream-50 hover:bg-forest-800">
              Log in to apply
            </a>
          )}
        </div>
      </motion.div>

      {/* Applicants list — only ever populated for the owning teacher;
          backend returns 403 for anyone else, so this section stays empty. */}
      {applicants?.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-forest-950">
            Applicants ({applicants.length})
          </h2>
          <div className="mt-4 space-y-3">
            {applicants.map((a) => (
              <div key={a.application_id} className="flex items-center justify-between rounded-xl border border-forest-100 bg-cream-50 p-4">
                <div>
                  <p className="font-semibold text-forest-900">{a.student_name}</p>
                  <p className="text-xs text-ink-400 capitalize">{a.status}</p>
                </div>
                {a.status === 'pending' ? (
                  <button
                    onClick={() => acceptMutation.mutate(a.application_id)}
                    disabled={acceptMutation.isPending}
                    className="rounded-full bg-forest-900 px-5 py-2 text-sm font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
                  >
                    Accept
                  </button>
                ) : a.status === 'accepted' ? (
                  <span className="flex items-center gap-1 text-sm font-semibold text-forest-700">
                    <CheckCircle2 size={15} /> Accepted
                  </span>
                ) : (
                  <span className="text-sm text-ink-400">Rejected</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
