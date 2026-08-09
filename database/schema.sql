-- Tuition Media schema (condensed production-ready)

CREATE TYPE user_role AS ENUM ('student','teacher','admin');
CREATE TYPE post_status AS ENUM ('active','completed','cancelled');
CREATE TYPE app_status AS ENUM ('pending','accepted','rejected');
CREATE TYPE mode_type AS ENUM ('online','offline','both');

CREATE TABLE users(
 user_id SERIAL PRIMARY KEY,
 full_name VARCHAR(100) NOT NULL,
 email VARCHAR(150) UNIQUE NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 role user_role NOT NULL,
 profile_picture VARCHAR(255),
 account_status VARCHAR(20) DEFAULT 'active' CHECK(account_status IN('active','suspended')),
 last_login TIMESTAMPTZ,
 created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students(
 student_id SERIAL PRIMARY KEY,
 user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
 education_level VARCHAR(50),
 institution VARCHAR(100),
 medium VARCHAR(50),
 bio TEXT,
 phone VARCHAR(20),
 district VARCHAR(80),
 area VARCHAR(100)
);

CREATE TABLE teachers(
 teacher_id SERIAL PRIMARY KEY,
 user_id INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
 qualification VARCHAR(150),
 institution VARCHAR(100),
 current_level VARCHAR(100),
 major VARCHAR(150),
 experience_years INT DEFAULT 0,
 gender VARCHAR(20),
 hourly_rate INT,
 district VARCHAR(80),
 area VARCHAR(100),
 phone VARCHAR(20)
);


CREATE TABLE subjects(
 subject_id SERIAL PRIMARY KEY,
 subject_name VARCHAR(100) UNIQUE NOT NULL,
 category VARCHAR(50)
);


CREATE TABLE teacher_subjects(
 teacher_id INT REFERENCES teachers(teacher_id) ON DELETE CASCADE,
 subject_id INT REFERENCES subjects(subject_id) ON DELETE CASCADE,
 proficiency_level VARCHAR(30) CHECK (proficiency_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
 PRIMARY KEY (teacher_id, subject_id)
);


CREATE TABLE teacher_tuition_posts(
 post_id SERIAL PRIMARY KEY,
 teacher_id INT REFERENCES teachers(teacher_id) ON DELETE CASCADE,
 subject_id INT REFERENCES subjects(subject_id),
 title VARCHAR(150) NOT NULL,
 description TEXT,
 expected_salary INT,
 duration VARCHAR(100),
 class_level VARCHAR(50),
 location VARCHAR(200),
 mode mode_type DEFAULT 'both',
 preferred_gender VARCHAR(20) DEFAULT 'any' CHECK(preferred_gender IN('male','female','any')),
 vacancy INT DEFAULT 1,
 days_per_week INT,
 preferred_time VARCHAR(100),
 deadline DATE,
 status post_status DEFAULT 'active',
 posted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE student_tuition_requests(
 request_id SERIAL PRIMARY KEY,
 student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
 subject_id INT REFERENCES subjects(subject_id),
 class_level VARCHAR(50),
 salary INT,
 description TEXT,
 preferred_institution VARCHAR(150),
 location VARCHAR(200),
 mode mode_type DEFAULT 'both',
 category_name VARCHAR(100) DEFAULT 'Home Tuition'
    CHECK (
        category_name IN (
            'Home Tuition',
            'Online Tuition',
            'Group Tuition',
            'Admission Coaching'
        )
    ),
 days_per_week INT,
 preferred_time VARCHAR(100),
 status post_status DEFAULT 'active',
 posted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE teacher_post_applications(
 application_id SERIAL PRIMARY KEY,
 post_id INT REFERENCES teacher_tuition_posts(post_id) ON DELETE CASCADE,
 student_id INT REFERENCES students(student_id) ON DELETE CASCADE,
 status app_status DEFAULT 'pending',
 applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(post_id,student_id)
);

CREATE TABLE student_request_applications(
 application_id SERIAL PRIMARY KEY,
 request_id INT REFERENCES student_tuition_requests(request_id) ON DELETE CASCADE,
 teacher_id INT REFERENCES teachers(teacher_id) ON DELETE CASCADE,
 status app_status DEFAULT 'pending',
 applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(request_id,teacher_id)
);

CREATE TABLE matches(
 match_id SERIAL PRIMARY KEY,
 teacher_id INT REFERENCES teachers,
 student_id INT REFERENCES students,
 teacher_post_id INT REFERENCES teacher_tuition_posts,
 student_request_id INT REFERENCES student_tuition_requests,
 status VARCHAR(20)
    DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),
 started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
 ended_at TIMESTAMPTZ
);


CREATE TABLE resources(
 resource_id SERIAL PRIMARY KEY,
 teacher_id INT REFERENCES teachers ON DELETE CASCADE,
 subject_id INTEGER REFERENCES subjects(subject_id),
 class_level VARCHAR(50),
 title VARCHAR(150) NOT NULL,
 description TEXT,
 file_url VARCHAR(255) NOT NULL,
 file_type VARCHAR(30),
 download_count INT DEFAULT 0,
 uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE resource_bookmarks(
 student_id INT REFERENCES students ON DELETE CASCADE,
 resource_id INT REFERENCES resources ON DELETE CASCADE,
 created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(student_id,resource_id)
);

CREATE TABLE reviews(
 review_id SERIAL PRIMARY KEY,
 match_id INT REFERENCES matches(match_id) ON DELETE CASCADE,
 reviewer_user_id INT REFERENCES users(user_id),
 reviewee_user_id INT REFERENCES users(user_id),
 rating INT CHECK(rating BETWEEN 1 AND 5),
 comment TEXT,
 created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(match_id,reviewer_user_id),
 CHECK (reviewer_user_id != reviewee_user_id)
);

CREATE TABLE questions (
    question_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(subject_id),
    title VARCHAR(150) NOT NULL,
    body TEXT,
    image_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'unsolved' CHECK (status IN ('unsolved','solved')),
    posted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (body IS NOT NULL OR image_url IS NOT NULL)
);

CREATE TABLE answers (
    answer_id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    body TEXT,
    image_url VARCHAR(255),
    is_accepted BOOLEAN DEFAULT FALSE,
    posted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (body IS NOT NULL OR image_url IS NOT NULL)
);

CREATE TABLE notifications(
 notification_id SERIAL PRIMARY KEY,
 user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
 type VARCHAR(50),
 message TEXT NOT NULL,
 link VARCHAR(255),
 is_read BOOLEAN DEFAULT FALSE,
 created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);



CREATE INDEX idx_teacher_posts_subject ON teacher_tuition_posts(subject_id);
CREATE INDEX idx_teacher_posts_location ON teacher_tuition_posts(location);
CREATE INDEX idx_student_requests_subject ON student_tuition_requests(subject_id);
CREATE INDEX idx_resources_teacher ON resources(teacher_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);