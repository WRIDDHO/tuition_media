import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, FileText, ClipboardList, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUnreadNotificationCount } from '@/services/activityService';
import { getMyTeacherPosts } from '@/services/postService';
import { getMyStudentRequests } from '@/services/postService';
import { Spinner } from '@/components/shared/Primitives';

export default function Dashboard() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const { data: unread } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadNotificationCount,
  });

  const { data: myItems, isLoading } = useQuery({
    queryKey: ['my-items', user?.role],
    queryFn: isTeacher ? getMyTeacherPosts : getMyStudentRequests,
  });

  const stats = [
    { icon: FileText, label: isTeacher ? 'My Posts' : 'My Requests', value: myItems?.length ?? '—' },
    { icon: Bell, label: 'Unread Notifications', value: unread ?? '—' },
    { icon: ClipboardList, label: 'Applications', value: '—' },
    { icon: Star, label: 'Rating', value: '—' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-forest-950">
        Welcome back, {user?.fullName?.split(' ')[0]}
      </h1>
      <p className="mt-1 text-ink-600 capitalize">{user?.role} dashboard</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-forest-100 bg-cream-50 p-5"
          >
            <s.icon size={20} className="text-forest-700" />
            <p className="mt-3 font-display text-2xl font-semibold text-forest-950">{s.value}</p>
            <p className="text-sm text-ink-600">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-forest-950">
          {isTeacher ? 'My Posts' : 'My Requests'}
        </h2>
        {isLoading ? (
          <div className="py-10"><Spinner /></div>
        ) : !myItems?.length ? (
          <p className="mt-3 text-sm text-ink-600">Nothing here yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {myItems.map((item) => (
              <div key={item.post_id ?? item.request_id} className="rounded-xl border border-forest-100 bg-cream-50 p-4">
                <p className="font-semibold text-forest-900">{item.title ?? item.subject_name}</p>
                <p className="text-sm text-ink-600">{item.status}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
