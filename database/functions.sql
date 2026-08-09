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
DROP PROCEDURE IF EXISTS accept_post_application;
CREATE OR REPLACE PROCEDURE accept_post_application(
    IN p_application_id INTEGER,
    IN p_teacher_id INTEGER,
    OUT out_success BOOLEAN,
    OUT out_message TEXT,
    OUT out_match_id INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_post_id INTEGER;
    v_student_id INTEGER;
    v_post_owner_id INTEGER;
    v_current_status VARCHAR(20);
BEGIN
    out_success := FALSE;
    out_message := '';
    out_match_id := NULL;

    BEGIN
        -- Step 1: find the application, and lock this row so two accepts can't race
        SELECT a.post_id, a.student_id, a.status, tp.teacher_id
        INTO v_post_id, v_student_id, v_current_status, v_post_owner_id
        FROM teacher_post_applications a
        JOIN teacher_tuition_posts tp ON tp.post_id = a.post_id
        WHERE a.application_id = p_application_id
        FOR UPDATE;

        IF v_post_id IS NULL THEN
            out_message := 'Application not found';
            RETURN;
        END IF;

        IF v_post_owner_id <> p_teacher_id THEN
            out_message := 'You do not own this post';
            RETURN;
        END IF;

        IF v_current_status <> 'pending' THEN
            out_message := 'This application has already been ' || v_current_status;
            RETURN;
        END IF;

        -- Step 2: mark this application accepted
        UPDATE teacher_post_applications
        SET status = 'accepted'
        WHERE application_id = p_application_id;

        -- Step 3: reject every OTHER pending application for the same post
        UPDATE teacher_post_applications
        SET status = 'rejected'
        WHERE post_id = v_post_id
          AND application_id <> p_application_id
          AND status = 'pending';

        -- Step 4: create the match
        INSERT INTO matches (teacher_id, student_id, teacher_post_id, status)
        VALUES (p_teacher_id, v_student_id, v_post_id, 'active')
        RETURNING match_id INTO out_match_id;

        out_success := TRUE;
        out_message := 'Application accepted and match created';

    EXCEPTION WHEN OTHERS THEN
        out_success := FALSE;
        out_message := SQLERRM;
        out_match_id := NULL;
        RETURN;
    END;
END;
$$;