import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UploadCloud, FileCheck2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllSubjects } from '@/services/studentService';
import { uploadResource } from '@/services/activityService';

const ACCEPTED = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];

export default function UploadResource() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { data: subjects } = useQuery({ queryKey: ['subjects'], queryFn: getAllSubjects });

  const [form, setForm] = useState({ subjectId: '', classLevel: '', title: '', description: '' });
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function handleFiles(fileList) {
    const f = fileList?.[0];
    if (!f) return;
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      toast.error('Only PDF, DOC, DOCX, PPT, or PPTX files are allowed.');
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subjectId || !form.title || !file) {
      toast.error('Subject, title, and a file are all required.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('file', file);
      await uploadResource(fd);
      toast.success('Resource uploaded!');
      navigate('/resources');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold text-forest-950">Share a Resource</h1>
        <p className="mt-2 text-ink-600">Upload notes, practice sheets, or slides for students to download.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-3xl border border-forest-100 bg-cream-50 p-7">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition ${
              dragging ? 'border-forest-700 bg-forest-100' : 'border-forest-100 bg-white hover:border-forest-700'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(',')}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {file ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-3"
              >
                <FileCheck2 size={28} className="text-forest-700" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-forest-900">{file.name}</p>
                  <p className="text-xs text-ink-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="rounded-full p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ) : (
              <>
                <UploadCloud size={30} className="text-forest-700" />
                <p className="mt-3 text-sm font-medium text-ink-900">
                  Drag &amp; drop a file, or <span className="text-forest-700 underline">browse</span>
                </p>
                <p className="mt-1 text-xs text-ink-400">PDF, DOC, DOCX, PPT, PPTX · up to 20MB</p>
              </>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Subject</label>
            <select
              value={form.subjectId}
              onChange={(e) => update('subjectId', e.target.value)}
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
            >
              <option value="">Select a subject</option>
              {subjects?.map((s) => (
                <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Class level</label>
            <input
              value={form.classLevel}
              onChange={(e) => update('classLevel', e.target.value)}
              placeholder="e.g. Class 10"
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Title</label>
            <input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Algebra Practice Sheet"
              className="w-full rounded-xl border border-forest-100 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-700"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-900">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              placeholder="What's covered in this resource?"
              className="w-full rounded-xl border border-forest-100 bg-white p-3 text-sm outline-none focus:border-forest-700"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-forest-900 py-3 font-semibold text-cream-50 hover:bg-forest-800 disabled:opacity-60"
          >
            {saving ? 'Uploading…' : 'Upload resource'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}