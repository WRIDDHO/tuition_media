import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap, MessageCircleQuestion, FileText, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: GraduationCap,
    title: 'Two-way matching',
    text: 'Teachers post availability, students post requests — apply in either direction and let the right fit find you.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified reviews',
    text: 'Ratings are tied to real, completed matches — not anonymous drive-by comments.',
  },
  {
    icon: MessageCircleQuestion,
    title: 'Ask anything',
    text: 'Stuck on a problem at 11pm? Post it to the community and get an answer from a real tutor.',
  },
  {
    icon: FileText,
    title: 'Shared resources',
    text: 'Browse notes, practice sheets and slides uploaded by tutors, organized by subject.',
  },
];

export default function Landing() {
  return (
    <div>
      {/* HERO — the signature moment: two nodes (student + teacher) drawing
          a connecting line on load, echoing the navbar mark at full scale. */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-32">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 inline-block rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-600"
            >
              Bangladesh's tutor-matching platform
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-5xl font-semibold leading-[1.08] text-forest-950 md:text-6xl"
            >
              Find the tutor
              <br />
              who <span className="italic text-forest-700">actually</span> fits.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-md text-lg text-ink-600"
            >
              Post what you need, browse who's available, and connect directly —
              no middleman, no guesswork, just a match built on subject, schedule,
              and real reviews.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-9 flex flex-wrap gap-4"
            >
              <Link
                to="/teachers"
                className="group inline-flex items-center gap-2 rounded-full bg-forest-900 px-7 py-3.5 font-semibold text-cream-50 shadow-lg shadow-forest-900/20 transition hover:bg-forest-800"
              >
                Find a tutor
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full border-2 border-forest-900 px-7 py-3.5 font-semibold text-forest-900 transition hover:bg-forest-900 hover:text-cream-50"
              >
                Become a tutor
              </Link>
            </motion.div>
          </div>

          {/* animated connecting-nodes illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative mx-auto aspect-square w-full max-w-md"
          >
            <div className="absolute inset-0 rounded-[3rem] bg-forest-100" />
            <svg viewBox="0 0 400 400" className="relative h-full w-full">
              <motion.path
                d="M 110 130 Q 220 200 290 270"
                stroke="var(--color-ink-900)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: 0.6, ease: 'easeInOut' }}
              />
              <motion.circle
                cx="110" cy="130" r="46"
                fill="var(--color-forest-800)"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.3, stiffness: 120 }}
              />
              <motion.circle
                cx="290" cy="270" r="46"
                fill="var(--color-amber-500)"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.5, stiffness: 120 }}
              />
              <text x="110" y="137" textAnchor="middle" fontSize="15" fontWeight="700" fill="white">Student</text>
              <text x="290" y="277" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--color-forest-950)">Teacher</text>
            </svg>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="font-display text-3xl font-semibold text-forest-950">
          Everything a tutoring relationship needs
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className="rounded-2xl border border-forest-100 bg-cream-50 p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-forest-900/5"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-forest-900 text-cream-50">
                <f.icon size={20} />
              </div>
              <h3 className="font-display text-lg font-semibold text-forest-950">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-600">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-[2.5rem] bg-forest-950 px-10 py-16 text-center">
          <h2 className="font-display text-3xl font-semibold text-white md:text-4xl">
            Ready to start your first match?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-cream-100/70">
            It takes less than two minutes to set up your profile.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-3.5 font-semibold text-forest-950 transition hover:bg-amber-400"
          >
            Create your free account <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
