import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Download, Bookmark, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAllResources, getResourceDownloadUrl, toggleBookmark,
  updateResource, deleteResource,
} from '@/services/activityService';
import { getAllSubjects } from '@/services/studentService';
import { useAuth } from '@/context/AuthContext';
import { StaggerGrid, StaggerItem } from '@/components/shared/StaggerGrid';
import { SubjectPill, EmptyState, CardSkeletonGrid } from '@/components/shared/Primitives';

const fileTypeLabel = (mime = '') => {
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('word')) return 'DOC';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PPT';
  return 'FILE';
};

export default function Resources() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ subjectId: '', classLevel: '', title: '', description: '' });

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => getAllResources(),
  });
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: getAllSubjects, enabled: user?.role === 'teacher' });

  const bookmarkMutation = useMutation({
    mutationFn: toggleBookmark,
    onSuccess: (data) => {
      toast.success(data.bookmarked ? 'Bookmarked' : 'Removed from bookmarks');
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
    onError: () => toast.error('Please log in as a student to bookmark resources'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateResource(id, data),
    onSuccess: () => {
      toast.success('Resource updated');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not update resource'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteResource(id),
    onSuccess: () => {
      toast.success('Resource deleted');
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not delete resource'),
  });

  function startEditing(r) {
    setEditingId(r.resource_id);
    setEditForm({
      subjectId: r.subject_id ?? '',
      classLevel: r.class_level ?? '',
      title: r.title ?? '',
      description: r.description ?? '',
    });
  }

  function handleDelete(id) {
    if (!window.confirm('Delete this resource? This cannot be undone.')) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl font-semibold text-forest-950">Resources</h1>
      <p className="mt-2 text-ink-600">Notes, practice sheets and slides shared by tutors.</p>

      {isLoading ? (
        <CardSkeletonGrid count={6} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" />
      ) : !resources?.length ? (
        <EmptyState title="No resources yet" />
      ) : (
        <StaggerGrid className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => {
            const isOwner = user?.role === 'teacher' && r.teacher_user_id === user.userId;
            const isEditingThis = editingId === r.resource_id;

            return (
              <StaggerItem key={r.resource_id}>
                <motion.div className="flex h-full flex-col rounded-2xl border border-forest-100 bg-cream-50 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-900 text-xs font-bold text-cream-50">
                      {fileTypeLabel(r.file_type)}
                    </div>
                    <div className="flex items-center gap-1">
                      {user?.role === 'student' && (
                        <button
                          onClick={() => bookmarkMutation.mutate(r.resource_id)}
                          className="rounded-full p-2 text-ink-400 hover:bg-forest-100 hover:text-forest-900"
                          aria-label="Bookmark"
                        >
                          <Bookmark size={18} />
                        </button>
                      )}
                      {isOwner && !isEditingThis && (
                        <>
                          <button
                            onClick={() => startEditing(r)}
                            className="rounded-full p-2 text-ink-400 hover:bg-forest-100 hover:text-forest-900"
                            aria-label="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.resource_id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-full p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditingThis ? (
                    <div className="mt-4 space-y-2">
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                        className="w-full rounded-lg border border-forest-100 bg-white px-3 py-1.5 text-sm outline-none focus:border-forest-700"
                        placeholder="Title"
                      />
                      <select
                        value={editForm.subjectId}
                        onChange={(e) => setEditForm((f) => ({ ...f, subjectId: e.target.value }))}
                        className="w-full rounded-lg border border-forest-100 bg-white px-3 py-1.5 text-sm outline-none focus:border-forest-700"
                      >
                        <option value="">Select subject</option>
                        {subjects?.map((s) => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
                      </select>
                      <input
                        value={editForm.classLevel}
                        onChange={(e) => setEditForm((f) => ({ ...f, classLevel: e.target.value }))}
                        className="w-full rounded-lg border border-forest-100 bg-white px-3 py-1.5 text-sm outline-none focus:border-forest-700"
                        placeholder="Class level"
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                        rows={2}
                        className="w-full rounded-lg border border-forest-100 bg-white p-2 text-sm outline-none focus:border-forest-700"
                        placeholder="Description"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => updateMutation.mutate({ id: r.resource_id, data: editForm })}
                          disabled={updateMutation.isPending || !editForm.title || !editForm.subjectId}
                          className="rounded-full bg-forest-900 px-4 py-1.5 text-xs font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-full border border-forest-100 px-4 py-1.5 text-xs font-semibold text-ink-600 hover:bg-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerGrid>
      )}
    </div>
  );
}
