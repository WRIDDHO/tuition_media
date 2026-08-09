INSERT INTO subjects (subject_name, category) VALUES
  ('Mathematics', 'Science'),
  ('Physics', 'Science'),
  ('Chemistry', 'Science'),
  ('Biology', 'Science'),
  ('English', 'Language'),
  ('Bangla', 'Language'),
  ('ICT', 'Technology')
ON CONFLICT (subject_name) DO NOTHING;