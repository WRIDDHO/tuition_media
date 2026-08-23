import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Camera, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyAccount, updateMyAccount, uploadProfilePicture } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/shared/Primitives';

const FILE_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export default function AccountSettings() {
  const { user, login } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [fullName, setFullName] = useState('');

  const { data: account, isLoading } = useQuery({
    queryKey: ['my-account'],
    queryFn: getMyAccount,
  });

  useEffect(() => {
    if (account?.full_name) setFullName(account.full_name);
  }, [account]);

  const nameMutation = useMutation({
    mutationFn: () => updateMyAccount({ fullName }),
    onSuccess: (updated) => {
      toast.success('Name updated');
      queryClient.invalidateQueries({ queryKey: ['my-account'] });
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, fullName: updated.full_name }));
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Could not update name'),
  });

  const pictureMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('image', file);
      return uploadProfilePicture(fd);
    },
    onSuccess: () => {
      toast.success('Profile picture updated');
      queryClient.invalidateQueries({ queryKey: ['my-account'] });
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Upload failed'),
  });

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (file) pictureMutation.mutate(file);
  }

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>;
  }

  const pictureUrl = account?.profile_picture ? `${FILE_BASE}${account.profile_picture}` : null;

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold text-forest-950">Account Settings</h1>
        <p className="mt-2 text-ink-600">Manage your name and profile picture.</p>

        <div className="mt-8 flex flex-col items-center rounded-3xl border border-forest-100 bg-cream-50 p-8">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-cream-50 bg-forest-900 shadow-md">
              {pictureUrl ? (
                <img src={pictureUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User size={40} className="text-cream-50" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={pictureMutation.isPending}
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-forest-950 shadow-md transition hover:bg-amber-400 disabled:opacity-60"
              aria-label="Change profile picture"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          <p className="mt-4 text-xs text-ink-400">
            {pictureMutation.isPending ? 'Uploading…' : 'JPEG, PNG, or WEBP · up to 3MB'}
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-forest-100 bg-cream-50 p-7">
          <label className="mb-1.5 block text-sm font-medium text-ink-900">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
          />
          <p className="mt-2 text-xs text-ink-400">Email: {account?.email} (cannot be changed)</p>

          <button
            onClick={() => nameMutation.mutate()}
            disabled={nameMutation.isPending || fullName === account?.full_name}
            className="mt-5 rounded-xl bg-forest-900 px-6 py-2.5 text-sm font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-50"
          >
            {nameMutation.isPending ? 'Saving…' : 'Save name'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}