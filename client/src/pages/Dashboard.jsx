import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Bell, FileText, ClipboardList, Star, Sparkles, ArrowRight, PlusCircle, UploadCloud } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUnreadNotificationCount } from '@/services/activityService';
import { getMyTeacherPosts, getMyStudentRequests } from '@/services/postService';
import { getMyTeacherProfile } from '@/services/teacherService';
import { getMyStudentProfile } from '@/services/studentService';
import { Spinner } from '@/components/shared/Primitives';

const STATUS_COLORS = {
  active: '#227d5c',
  pending: '#e8a33d',
  closed: '#7c8a81',
  fulfilled: '#124a37',
  expired: '#c9861a',
};
const FALLBACK_COLOR = '#93a39a';

export default function Dashboard() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const { data: profile, isLoading: profileLoading, isError: noProfile } = useQuery({
    queryKey: ['my-profile', user?.role],
    queryFn: isTeacher ? getMyTeacherProfile : getMyStudentProfile,
    retry: false,
  });

  const { data: unread } = useQuery({
    queryKey: ['unread-count'],
    queryFn: getUnreadNotificationCount,
    enabled: !noProfile,
  });

  const { data: myItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['my-items', user?.role],
    queryFn: isTeacher ? getMyTeacherPosts : getMyStudentRequests,
    enabled: !noProfile,
  });

  const statusBreakdown = useMemo(() => {
    if (!myItems?.length) return [];
    const counts = {};
    for (const item of myItems) {
      const key = item.status || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [myItems]);

  if (profileLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;
  }

  if (noProfile) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border border-forest-100 bg-cream-50"
        >
          <div className="bg-gradient-to-br from-forest-800 to-forest-950 px-8 py-10 text-center">
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 180, delay: 0.15 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-forest-950"
            >
              <Sparkles size={28} />
            </motion.div>
            <h1 className="mt-5 font-display text-2xl font-semibold text-white">
              Welcome, {user?.fullName?.split(' ')[0]}!
            </h1>
            <p className="mt-2 text-cream-100/80">
              You're almost set up. Complete your {user?.role} profile so {isTeacher ? 'students' : 'tutors'} know who they're working with.
            </p>
          </div>
          <div className="p-8">
            <Link
              to={isTeacher ? '/teachers/me/edit' : '/students/me/edit'}
              className="group flex items-center justify-between rounded-2xl bg-forest-900 px-6 py-4 font-semibold text-cream-50 transition hover:bg-forest-800"
            >
              Complete your profile — takes under a minute
              <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </Link>
            <p className="mt-4 text-center text-xs text-ink-400">
              You can still browse the platform without a profile, but you won't be
              able to {isTeacher ? 'publish posts or upload resources' : 'post requests or apply to tutors'} until it's complete.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const stats = [
    { icon: FileText, label: isTeacher ? 'My Posts' : 'My Requests', value: myItems?.length ?? 0 },
    { icon: Bell, label: 'Unread Notifications', value: unread ?? 0 },
    { icon: ClipboardList, label: 'Applications', value: '—' },
    { icon: Star, label: 'Rating', value: profile?.avg_rating ?? '—' },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-forest-950">
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-ink-600 capitalize">{user?.role} dashboard</p>
        </div>
        <Link
          to={isTeacher ? '/teacher-posts/new' : '/requests/new'}
          className="flex items-center gap-2 rounded-full bg-forest-900 px-5 py-2.5 text-sm font-semibold text-cream-50 hover:bg-forest-800"
        >
          <PlusCircle size={16} /> {isTeacher ? 'Publish a post' : 'Post a request'}
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="rounded-2xl border border-forest-100 bg-cream-50 p-5"
        >
          <p className="mb-2 text-sm font-semibold text-forest-900">
            {isTeacher ? 'Posts' : 'Requests'} by status
          </p>
          {!statusBreakdown.length ? (
            <div className="flex h-[160px] items-center justify-center text-xs text-ink-400">
              No data yet
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={140}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={38}
                    outerRadius={60}
                    paddingAngle={3}
                  >
                    {statusBreakdown.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] || FALLBACK_COLOR}
                        stroke="var(--color-cream-50)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--color-forest-100)', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1.5 text-xs">
                {statusBreakdown.map((entry) => (
                  <li key={entry.status} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[entry.status] || FALLBACK_COLOR }}
                    />
                    <span className="capitalize text-ink-600">{entry.status}</span>
                    <span className="font-semibold text-forest-900">{entry.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </div>

      {isTeacher && (
        <Link
          to="/resources/new"
          className="mt-5 flex items-center gap-2 text-sm font-semibold text-forest-700 ink-underline"
        >
          <UploadCloud size={15} /> Upload a teaching resource
        </Link>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-forest-950">
          {isTeacher ? 'My Posts' : 'My Requests'}
        </h2>
        {itemsLoading ? (
          <div className="py-10"><Spinner /></div>
        ) : !myItems?.length ? (
          <p className="mt-3 text-sm text-ink-600">Nothing here yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {myItems.map((item) => (
              <Link
                key={item.post_id ?? item.request_id}
                to={isTeacher ? `/teacher-posts/${item.post_id}` : `/requests/${item.request_id}`}
                className="block rounded-xl border border-forest-100 bg-cream-50 p-4 hover:border-forest-700"
              >
                <p className="font-semibold text-forest-900">{item.title ?? item.subject_name}</p>
                <p className="text-sm capitalize text-ink-600">{item.status}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}