import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/activityService';
import { EmptyState, Spinner } from '@/components/shared/Primitives';

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: getMyNotifications,
  });

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-forest-950">Notifications</h1>
        {!!notifications?.length && (
          <button
            onClick={() => readAllMutation.mutate()}
            className="flex items-center gap-1.5 text-sm font-semibold text-forest-700 ink-underline"
          >
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : !notifications?.length ? (
        <EmptyState title="You're all caught up" description="New notifications will show up here." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <motion.div
              key={n.notification_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                to={n.link || '#'}
                onClick={() => !n.is_read && readMutation.mutate(n.notification_id)}
                className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
                  n.is_read ? 'border-forest-100 bg-cream-50' : 'border-forest-700 bg-forest-50'
                }`}
              >
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  n.is_read ? 'bg-forest-100 text-forest-700' : 'bg-forest-900 text-cream-50'
                }`}>
                  <Bell size={15} />
                </div>
                <div>
                  <p className="text-sm text-ink-900">{n.message}</p>
                  <p className="mt-1 text-xs text-ink-400">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
