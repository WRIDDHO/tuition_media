CREATE TABLE users (
user_id SERIAL PRIMARY KEY,
full_name VARCHAR(100) NOT NULL,
email VARCHAR(120) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
role VARCHAR(10) CHECK(role IN ('student','teacher','admin')) NOT NULL,
phone VARCHAR(20),profile_picture TEXT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);


CREATE TABLE students(
student_id SERIAL PRIMARY KEY,
user_id INT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
institution VARCHAR(150),
class_level VARCHAR(50),
address TEXT);



CREATE TABLE teachers(
teacher_id SERIAL PRIMARY KEY,
user_id INT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
university VARCHAR(150),
department VARCHAR(100),
experience_years INT DEFAULT 0 CHECK(experience_years>=0),
hourly_rate NUMERIC(10,2),
bio TEXT,
average_rating NUMERIC(2,1) DEFAULT 0 CHECK(average_rating BETWEEN 0 AND 5));



CREATE TABLE subjects(
subject_id SERIAL PRIMARY KEY,
subject_name VARCHAR(100) UNIQUE NOT NULL);
CREATE TABLE teacher_subjects(
teacher_subject_id SERIAL PRIMARY KEY,
teacher_id INT REFERENCES teachers ON DELETE CASCADE,
subject_id INT REFERENCES subjects ON DELETE CASCADE,
UNIQUE(teacher_id,subject_id));



CREATE TABLE teacher_posts(
post_id SERIAL PRIMARY KEY,
teacher_id INT REFERENCES teachers ON DELETE CASCADE,
subject_id INT REFERENCES subjects,
title VARCHAR(150),
description TEXT,
location VARCHAR(150),
salary NUMERIC(10,2),
teaching_mode VARCHAR(20),
status VARCHAR(20) DEFAULT 'active',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);


CREATE TABLE student_requests(
request_id SERIAL PRIMARY KEY,
student_id INT REFERENCES students ON DELETE CASCADE,
subject_id INT REFERENCES subjects,title VARCHAR(150),
description TEXT,
location VARCHAR(150),
budget NUMERIC(10,2),
teaching_mode VARCHAR(20),
status VARCHAR(20) DEFAULT 'open',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);



CREATE TABLE applications(
application_id SERIAL PRIMARY KEY,
request_id INT REFERENCES student_requests ON DELETE CASCADE,
teacher_id INT REFERENCES teachers ON DELETE CASCADE,
application_message TEXT,
status VARCHAR(20) DEFAULT 'pending',
applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
UNIQUE(request_id,teacher_id));



CREATE TABLE reviews(
review_id SERIAL PRIMARY KEY,
student_id INT REFERENCES students ON DELETE CASCADE,
teacher_id INT REFERENCES teachers ON DELETE CASCADE,
rating INT CHECK(rating BETWEEN 1 AND 5),
comment TEXT,
review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
UNIQUE(student_id,teacher_id));



CREATE TABLE questions(
question_id SERIAL PRIMARY KEY,
student_id INT REFERENCES students ON DELETE CASCADE,
subject_id INT REFERENCES subjects,
title VARCHAR(200),
question_text TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);



CREATE TABLE answers(
answer_id SERIAL PRIMARY KEY,
question_id INT REFERENCES questions ON DELETE CASCADE,
teacher_id INT REFERENCES teachers ON DELETE CASCADE,
answer_text TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);



CREATE TABLE resources(
resource_id SERIAL PRIMARY KEY,
teacher_id INT REFERENCES teachers ON DELETE CASCADE,
subject_id INT REFERENCES subjects,
title VARCHAR(150),
description TEXT,
file_url TEXT,
uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);



CREATE TABLE bookmarks(
    bookmark_id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students ON DELETE CASCADE,
    teacher_id INT REFERENCES teachers ON DELETE CASCADE,
    resource_id INT REFERENCES resources ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK(teacher_id IS NOT NULL OR resource_id IS NOT NULL));



CREATE TABLE messages(
    message_id SERIAL PRIMARY KEY,
    sender_user_id INT REFERENCES users ON DELETE CASCADE,
    receiver_user_id INT REFERENCES users ON DELETE CASCADE,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);



CREATE TABLE notifications(
    notification_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users ON DELETE CASCADE,
    title VARCHAR(150),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);