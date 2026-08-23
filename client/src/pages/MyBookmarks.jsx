import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, BookmarkX } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyBookmarks, toggleBookmark, getResourceDownloadUrl } from '@/services/activityService';
import { StaggerGrid, StaggerItem } from '@/components/shared/StaggerGrid';
import { SubjectPill, EmptyState, Spinner } from '@/components/shared/Primitives';

export default function MyBookmarks() {
  const queryClient = useQueryClient();

  // Load every resource the logged-in student has bookmarked
  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: getMyBookmarks,
  });

  // The bookmark endpoint is a toggle, so calling it again removes the bookmark
  const removeMutation = useMutation({
    mutationFn: toggleBookmark,
    onSuccess: () => {
      toast.success('Removed from bookmarks');
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
    onError: () => {
      toast.error('Could not remove bookmark. Please try again.');
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-forest-950">My Bookmarks</h1>
      <p className="mt-2 text-ink-600">Resources you've saved for later.</p>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      ) : !bookmarks?.length ? (
        <div className="mt-8">
          <EmptyState
            title="No bookmarks yet"
            description="Save resources from the Resources page to find them here."
          />
        </div>
      ) : (
        <StaggerGrid className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((b) => (
            <StaggerItem key={b.resource_id}>
              <motion.div className="flex h-full flex-col rounded-2xl border border-forest-100 bg-cream-50 p-6">
                <div className="flex items-start justify-between">
                  <SubjectPill>{b.subject_name}</SubjectPill>

                  <button
                    onClick={() => removeMutation.mutate(b.resource_id)}
                    disabled={removeMutation.isPending}
                    className="rounded-full p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    aria-label="Remove bookmark"
                  >
                    <BookmarkX size={16} />
                  </button>
                </div>

                <h3 className="mt-3 font-display text-lg font-semibold text-forest-950">
                  {b.title}
                </h3>
                <p className="mt-1 text-xs text-ink-400">by {b.teacher_name}</p>

                <a
                  href={getResourceDownloadUrl(b.resource_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto flex w-fit items-center gap-1.5 self-start rounded-full bg-forest-100 px-4 py-2 text-xs font-semibold text-forest-900 hover:bg-forest-100/70"
                >
                  <Download size={14} /> Download
                </a>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}
    </div>
  );
}
