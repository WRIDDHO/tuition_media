const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);
const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);
const teacherRoutes = require('./routes/teacher.routes');
app.use('/api/teachers', teacherRoutes);
const studentRoutes = require('./routes/student.routes');
app.use('/api/students', studentRoutes);
const subjectRoutes = require('./routes/subject.routes');
app.use('/api/subjects', subjectRoutes);
const teacherSubjectRoutes = require('./routes/teacherSubject.routes');
app.use('/api/teacher-subjects', teacherSubjectRoutes);
//src/controllers/teacherSubject.controller.js->src/middleware/resolveTeacherId.middleware.js->src/routes/teacherSubject.routes.js
const teacherPostRoutes = require('./routes/teacherPost.routes');
app.use('/api/teacher-posts', teacherPostRoutes);
//teacherPost.model.js->teacherPost.controller.js->teacherPost.routes.js->app.js

const studentRequestRoutes = require('./routes/studentRequest.routes');
app.use('/api/student-requests', studentRequestRoutes);
//studentRequest.model.js->studentPost.routes.js->app.js

const applicationRoutes = require('./routes/application.routes');
app.use('/api/applications', applicationRoutes);
//application.model.js(last function)->application.controller.js->application.routes.js->app.js
// Simple test route to confirm the server is alive

app.use('/uploads', express.static('src/uploads'));
//upload.middleware.js->uploads/question folder->.gitignore add->comand diye getkeep

const questionRoutes = require('./routes/question.routes');
app.use('/api/questions', questionRoutes);

const answerRoutes = require('./routes/answer.routes');
app.use('/api/answers', answerRoutes);

const resourceRoutes = require('./routes/resource.routes');
app.use('/api/resources', resourceRoutes);
//upload.middleware->resource.model->controller->routes then app.js 

const bookmarkRoutes = require('./routes/bookmark.routes');
app.use('/api/bookmarks', bookmarkRoutes);

const reviewRoutes = require('./routes/review.routes');
app.use('/api/reviews', reviewRoutes);

const notificationRoutes = require('./routes/notification.routes');
app.use('/api/notifications', notificationRoutes);

const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

const matchRoutes = require('./routes/match.routes');
app.use('/api/matches', matchRoutes);

const reportRoutes = require('./routes/report.routes');
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Tuition Media API is running' });
});
app.get('/api/version', (req, res) => {
  res.json({ version: '1.0.0' });
});

//there
module.exports = app;