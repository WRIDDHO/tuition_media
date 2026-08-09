DROP FUNCTION IF EXISTS search_teachers(TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION search_teachers(
    p_subject_name TEXT DEFAULT NULL,
    p_district TEXT DEFAULT NULL,
    p_gender TEXT DEFAULT NULL,
    p_min_rate INTEGER DEFAULT NULL,
    p_max_rate INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE(
    teacher_id INTEGER,
    full_name VARCHAR,
    qualification VARCHAR,
    institution VARCHAR,
    experience_years INTEGER,
    hourly_rate INTEGER,
    district VARCHAR,
    area VARCHAR,
    subjects JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.teacher_id,
        u.full_name,
        t.qualification,
        t.institution,
        t.experience_years,
        t.hourly_rate,
        t.district,
        t.area,
        COALESCE(
            (
                SELECT JSON_AGG(
                    JSON_BUILD_OBJECT('subject_name', s.subject_name, 'level', ts.proficiency_level)
                )
                FROM teacher_subjects ts
                JOIN subjects s ON s.subject_id = ts.subject_id
                WHERE ts.teacher_id = t.teacher_id
            ),
            '[]'::JSON
        ) AS subjects
    FROM teachers t
    INNER JOIN users u ON u.user_id = t.user_id
    WHERE
        (p_subject_name IS NULL OR EXISTS (
            SELECT 1 FROM teacher_subjects ts2
            JOIN subjects s2 ON s2.subject_id = ts2.subject_id
            WHERE ts2.teacher_id = t.teacher_id
              AND s2.subject_name ILIKE '%' || p_subject_name || '%'
        ))
        AND (p_district IS NULL OR t.district ILIKE p_district)
        AND (p_gender IS NULL OR t.gender = p_gender)
        AND (p_min_rate IS NULL OR t.hourly_rate >= p_min_rate)
        AND (p_max_rate IS NULL OR t.hourly_rate <= p_max_rate)
    ORDER BY t.experience_years DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;