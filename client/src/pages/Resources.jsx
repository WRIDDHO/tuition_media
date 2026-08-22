import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Download, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllResources, getResourceDownloadUrl, toggleBookmark } from '@/services/activityService';
import { useAuth } from '@/context/AuthContext';
import { StaggerGrid, StaggerItem } from '@/components/shared/StaggerGrid';
import { SubjectPill, EmptyState, Spinner } from '@/components/shared/Primitives';

const fileTypeLabel = (mime = '') => {
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('word')) return 'DOC';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PPT';
  return 'FILE';
};

export default function Resources() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => getAllResources(),
  });

  const bookmarkMutation = useMutation({
    mutationFn: toggleBookmark,
    onSuccess: (data) => {
      toast.success(data.bookmarked ? 'Bookmarked' : 'Removed from bookmarks');
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
    onError: () => toast.error('Please log in as a student to bookmark resources'),
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl font-semibold text-forest-950">Resources</h1>
      <p className="mt-2 text-ink-600">Notes, practice sheets and slides shared by tutors.</p>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner /></div>
      ) : !resources?.length ? (
        <EmptyState title="No resources yet" />
      ) : (
        <StaggerGrid className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <StaggerItem key={r.resource_id}>
              <motion.div className="flex h-full flex-col rounded-2xl border border-forest-100 bg-cream-50 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-900 text-xs font-bold text-cream-50">
                    {fileTypeLabel(r.file_type)}
                  </div>
                  {user?.role === 'student' && (
                    <button
                      onClick={() => bookmarkMutation.mutate(r.resource_id)}
                      className="rounded-full p-2 text-ink-400 hover:bg-forest-100 hover:text-forest-900"
                      aria-label="Bookmark"
                    >
                      <Bookmark size={18} />
                    </button>
                  )}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-forest-950">{r.title}</h3>
                {r.description && <p className="mt-1 line-clamp-2 text-sm text-ink-600">{r.description}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <SubjectPill>{r.subject_name}</SubjectPill>
                  {r.class_level && <SubjectPill>{r.class_level}</SubjectPill>}
                </div>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <p className="text-xs text-ink-400">{r.teacher_name} · {r.download_count ?? 0} downloads</p>
                  <a
                    href={getResourceDownloadUrl(r.resource_id)}
                    className="flex items-center gap-1.5 rounded-full bg-forest-100 px-4 py-2 text-xs font-semibold text-forest-900 hover:bg-forest-100/70"
                  >
                    <Download size={14} /> Download
                  </a>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}
    </div>
  );
}
