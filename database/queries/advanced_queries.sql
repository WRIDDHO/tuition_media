-- database/queries/advanced_queries.sql
--
-- A demonstration collection of meaningful Tuition Media queries. Every
-- query here answers a real question the platform would actually need
-- answered somewhere (a dashboard widget, a report, a moderation view) --
-- nothing here exists purely to show off syntax.
--
-- Assumes: schema.sql + database/migrations/*.sql have been applied.
-- Safe to run read-only against any populated database.


-- ============================================================
-- 1. BASIC SELECT
-- "What subjects does the platform support?"
-- ============================================================
SELECT subject_name, category
FROM subjects
ORDER BY subject_name;


-- ============================================================
-- 2. JOIN
-- "List every currently-active tuition post with its subject and teacher."
-- ============================================================
SELECT
    tp.title,
    s.subject_name,
    u.full_name AS teacher_name,
    tp.expected_salary
FROM teacher_tuition_posts tp
JOIN subjects s ON s.subject_id = tp.subject_id
JOIN teachers t ON t.teacher_id = tp.teacher_id
JOIN users u ON u.user_id = t.user_id
WHERE tp.status = 'active';


-- ============================================================
-- 3. MULTIPLE JOIN (4 tables)
-- "For every accepted application, show the post, the applying student,
--  and whether a match was actually created for it."
-- ============================================================
SELECT
    tp.title AS post_title,
    su.full_name AS student_name,
    a.status AS application_status,
    m.status AS match_status
FROM teacher_post_applications a
JOIN teacher_tuition_posts tp ON tp.post_id = a.post_id
JOIN students st ON st.student_id = a.student_id
JOIN users su ON su.user_id = st.user_id
LEFT JOIN matches m ON m.teacher_post_id = a.post_id AND m.student_id = a.student_id
WHERE a.status = 'accepted';


-- ============================================================
-- 4. LEFT JOIN
-- "Show every subject with how many teachers teach it -- including
--  subjects nobody currently teaches (they'd disappear with an INNER JOIN)."
-- ============================================================
SELECT
    s.subject_name,
    COUNT(ts.teacher_id) AS teacher_count
FROM subjects s
LEFT JOIN teacher_subjects ts ON ts.subject_id = s.subject_id
GROUP BY s.subject_id, s.subject_name
ORDER BY teacher_count DESC, s.subject_name;


-- ============================================================
-- 5. GROUP BY
-- "How many active tuition posts exist per subject?"
-- ============================================================
SELECT
    s.subject_name,
    COUNT(*) AS active_post_count
FROM teacher_tuition_posts tp
JOIN subjects s ON s.subject_id = tp.subject_id
WHERE tp.status = 'active'
GROUP BY s.subject_name;


-- ============================================================
-- 6. HAVING
-- "Which subjects have more than 2 active tuition posts right now?"
-- (a genuine 'high demand' report -- HAVING filters on the aggregate,
--  WHERE couldn't do this because active_post_count doesn't exist yet
--  at row-filtering time)
-- ============================================================
SELECT
    s.subject_name,
    COUNT(*) AS active_post_count
FROM teacher_tuition_posts tp
JOIN subjects s ON s.subject_id = tp.subject_id
WHERE tp.status = 'active'
GROUP BY s.subject_name
HAVING COUNT(*) > 2;


-- ============================================================
-- 7. SUBQUERY
-- "Which teachers charge more than the platform-wide average hourly rate?"
-- ============================================================
SELECT
    u.full_name,
    t.hourly_rate
FROM teachers t
JOIN users u ON u.user_id = t.user_id
WHERE t.hourly_rate > (
    SELECT AVG(hourly_rate) FROM teachers WHERE hourly_rate IS NOT NULL
);


-- ============================================================
-- 8. CORRELATED SUBQUERY
-- "List each teacher next to how many tuition posts they've made" --
-- correlated because the inner query re-runs per outer row, referencing
-- that row's teacher_id.
-- ============================================================
SELECT
    t.teacher_id,
    u.full_name,
    (
        SELECT COUNT(*)
        FROM teacher_tuition_posts tp
        WHERE tp.teacher_id = t.teacher_id
    ) AS post_count
FROM teachers t
JOIN users u ON u.user_id = t.user_id
ORDER BY post_count DESC;


-- ============================================================
-- 9. EXISTS
-- "Which teachers currently have at least one active tuition post?"
-- ============================================================
SELECT u.full_name
FROM teachers t
JOIN users u ON u.user_id = t.user_id
WHERE EXISTS (
    SELECT 1 FROM teacher_tuition_posts tp
    WHERE tp.teacher_id = t.teacher_id AND tp.status = 'active'
);


-- ============================================================
-- 10. NOT EXISTS
-- "Which teachers have never received a single application on any post?"
-- (a genuine 'needs visibility help' report for the platform team)
-- ============================================================
SELECT u.full_name
FROM teachers t
JOIN users u ON u.user_id = t.user_id
WHERE NOT EXISTS (
    SELECT 1
    FROM teacher_tuition_posts tp
    JOIN teacher_post_applications a ON a.post_id = tp.post_id
    WHERE tp.teacher_id = t.teacher_id
);


-- ============================================================
-- 11. UNION
-- "Which subjects have demand from either side of the market --
--  a teacher post or a student request?"
-- ============================================================
SELECT subject_id FROM teacher_tuition_posts
UNION
SELECT subject_id FROM student_tuition_requests;


-- ============================================================
-- 12. INTERSECT
-- "Which subjects have BOTH an active teacher post and an active student
--  request right now?" -- genuine two-sided-match candidates.
-- ============================================================
SELECT subject_id FROM teacher_tuition_posts WHERE status = 'active'
INTERSECT
SELECT subject_id FROM student_tuition_requests WHERE status = 'active';


-- ============================================================
-- 13. EXCEPT
-- "Which subjects are students actively requesting that no teacher
--  currently offers?" -- a genuine supply-gap report.
-- ============================================================
SELECT subject_id FROM student_tuition_requests WHERE status = 'active'
EXCEPT
SELECT subject_id FROM teacher_tuition_posts WHERE status = 'active';


-- ============================================================
-- 14. CASE
-- "Bucket teachers into an experience band for display on their profile."
-- ============================================================
SELECT
    u.full_name,
    t.experience_years,
    CASE
        WHEN t.experience_years >= 10 THEN 'Veteran'
        WHEN t.experience_years >= 3  THEN 'Experienced'
        ELSE 'New'
    END AS experience_band
FROM teachers t
JOIN users u ON u.user_id = t.user_id;


-- ============================================================
-- 15. AGGREGATE FUNCTIONS
-- "For each district, how many teachers are there, what do they charge
--  on average, and who's the most experienced?"
-- ============================================================
SELECT
    district,
    COUNT(*) AS teacher_count,
    ROUND(AVG(hourly_rate)::NUMERIC, 2) AS avg_hourly_rate,
    MAX(experience_years) AS most_experienced_years
FROM teachers
WHERE district IS NOT NULL
GROUP BY district
ORDER BY teacher_count DESC;


-- ============================================================
-- 16. WINDOW FUNCTIONS
-- (a) Rank reviewed teachers by rating *within their own district* --
--     PARTITION BY keeps the ranking fair across districts instead of
--     one city dominating a platform-wide list.
-- ============================================================
SELECT
    u.full_name,
    t.district,
    t.avg_rating,
    t.total_reviews,
    RANK() OVER (PARTITION BY t.district ORDER BY t.avg_rating DESC) AS rank_in_district
FROM teachers t
JOIN users u ON u.user_id = t.user_id
WHERE t.total_reviews > 0;

-- (b) For each tuition post, number its applications in the order they
--     arrived and show the gap since the previous applicant -- useful for
--     a teacher deciding how much interest a post is getting over time.
SELECT
    a.post_id,
    a.application_id,
    a.applied_at,
    ROW_NUMBER() OVER (PARTITION BY a.post_id ORDER BY a.applied_at) AS application_sequence,
    a.applied_at - LAG(a.applied_at) OVER (PARTITION BY a.post_id ORDER BY a.applied_at) AS time_since_previous
FROM teacher_post_applications a
ORDER BY a.post_id, application_sequence;

-- (c) Bonus: a post with more applications than average (correlated
--     subquery + aggregate, echoing the "find posts with above-average
--     interest" report a teacher dashboard would show).
SELECT
    tp.post_id,
    tp.title,
    (SELECT COUNT(*) FROM teacher_post_applications a WHERE a.post_id = tp.post_id) AS application_count
FROM teacher_tuition_posts tp
WHERE (
    SELECT COUNT(*) FROM teacher_post_applications a WHERE a.post_id = tp.post_id
) > (
    SELECT AVG(app_count) FROM (
        SELECT COUNT(*) AS app_count
        FROM teacher_post_applications
        GROUP BY post_id
    ) AS post_counts
);
