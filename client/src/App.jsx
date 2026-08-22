import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from '@/components/layout/Layout';

import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';

import Teachers from '@/pages/Teachers';
import TeacherProfile from '@/pages/TeacherProfile';
import TeacherProfileSetup from '@/pages/TeacherProfileSetup';
import StudentProfileSetup from '@/pages/StudentProfileSetup';

import TeacherPosts from '@/pages/TeacherPosts';
import TeacherPostDetail from '@/pages/TeacherPostDetail';
import PostTeacherPost from '@/pages/PostTeacherPost';

import Requests from '@/pages/Requests';
import RequestDetail from '@/pages/RequestDetail';
import PostRequest from '@/pages/PostRequest';

import MyApplications from '@/pages/MyApplications';

import Questions from '@/pages/Questions';
import QuestionDetail from '@/pages/QuestionDetail';
import AskQuestion from '@/pages/AskQuestion';

import Resources from '@/pages/Resources';
import Notifications from '@/pages/Notifications';

import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{ style: { borderRadius: '12px', background: '#16241d', color: '#faf8f3' } }}
      />
      <Routes>
        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Teacher profiles (public browsing) */}
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/teachers/:id" element={<TeacherProfile />} />

          {/* Teacher tuition posts (public browsing + student apply + teacher accept) */}
          <Route path="/teacher-posts" element={<TeacherPosts />} />
          <Route path="/teacher-posts/:id" element={<TeacherPostDetail />} />
          <Route
            path="/teacher-posts/new"
            element={<ProtectedRoute role="teacher"><PostTeacherPost /></ProtectedRoute>}
          />

          {/* Student requests (public browsing) */}
          <Route path="/requests" element={<Requests />} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route
            path="/requests/new"
            element={<ProtectedRoute role="student"><PostRequest /></ProtectedRoute>}
          />

          {/* Q&A (public browsing) */}
          <Route path="/questions" element={<Questions />} />
          <Route path="/questions/:id" element={<QuestionDetail />} />
          <Route
            path="/questions/new"
            element={<ProtectedRoute><AskQuestion /></ProtectedRoute>}
          />

          {/* Resources (public browsing) */}
          <Route path="/resources" element={<Resources />} />

          {/* Protected: profile setup */}
          <Route
            path="/teachers/me/edit"
            element={<ProtectedRoute role="teacher"><TeacherProfileSetup /></ProtectedRoute>}
          />
          <Route
            path="/students/me/edit"
            element={<ProtectedRoute role="student"><StudentProfileSetup /></ProtectedRoute>}
          />

          {/* Protected: personal activity */}
          <Route
            path="/my-applications"
            element={<ProtectedRoute role="student"><MyApplications /></ProtectedRoute>}
          />
          <Route
            path="/notifications"
            element={<ProtectedRoute><Notifications /></ProtectedRoute>}
          />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
