-- =====================
-- FUNCTION TANIMLARI
-- =====================

-- Bir grubun erisebilecegi ekranlari getir
CREATE OR REPLACE FUNCTION fn_get_group_screens(p_group_id INT)
RETURNS TABLE (
    screen_id INT,
    screen_name TEXT,
    screen_slug TEXT,
    screen_component TEXT,
    screen_icon TEXT,
    can_create BOOLEAN,
    can_read BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        (s.data->>'name')::TEXT,
        (s.data->>'slug')::TEXT,
        (s.data->>'component')::TEXT,
        (s.data->>'icon')::TEXT,
        COALESCE((gs.data->'permissions'->>'create')::BOOLEAN, false),
        COALESCE((gs.data->'permissions'->>'read')::BOOLEAN, false),
        COALESCE((gs.data->'permissions'->>'update')::BOOLEAN, false),
        COALESCE((gs.data->'permissions'->>'delete')::BOOLEAN, false)
    FROM group_screens gs
    INNER JOIN screens s ON s.id = (gs.data->>'screen_id')::INT
    WHERE (gs.data->>'group_id')::INT = p_group_id;
END;
$$ LANGUAGE plpgsql;

-- Yetki kontrolu
CREATE OR REPLACE FUNCTION fn_check_permission(
    p_user_id INT, p_screen_slug TEXT, p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_group_id INT;
    v_user_role TEXT;
    v_has_permission BOOLEAN;
BEGIN
    SELECT (data->>'group_id')::INT, data->>'role'
    INTO v_group_id, v_user_role FROM users WHERE id = p_user_id;
    IF v_user_role = 'supervisor' THEN RETURN TRUE; END IF;
    IF v_group_id IS NULL THEN RETURN FALSE; END IF;
    SELECT COALESCE((gs.data->'permissions'->>p_action)::BOOLEAN, false)
    INTO v_has_permission FROM group_screens gs
    INNER JOIN screens s ON s.id = (gs.data->>'screen_id')::INT
    WHERE (gs.data->>'group_id')::INT = v_group_id AND s.data->>'slug' = p_screen_slug;
    RETURN COALESCE(v_has_permission, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Genel istatistikler
CREATE OR REPLACE FUNCTION fn_get_stats()
RETURNS JSONB AS $$
DECLARE v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_users', (SELECT COUNT(*) FROM users),
        'total_groups', (SELECT COUNT(*) FROM groups),
        'total_screens', (SELECT COUNT(*) FROM screens),
        'total_files', (SELECT COUNT(*) FROM files),
        'total_logs', (SELECT COUNT(*) FROM logs),
        'users_per_group', (
            SELECT jsonb_agg(jsonb_build_object('group_name', g.data->>'name', 'user_count', COALESCE(u.cnt, 0)))
            FROM groups g LEFT JOIN (
                SELECT (data->>'group_id')::INT as gid, COUNT(*) as cnt FROM users
                WHERE data->>'group_id' IS NOT NULL GROUP BY (data->>'group_id')::INT
            ) u ON u.gid = g.id
        )
    ) INTO v_result;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
