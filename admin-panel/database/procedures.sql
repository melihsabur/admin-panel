-- =====================
-- PROCEDURE TANIMLARI
-- =====================

-- Ekran atama procedure
CREATE OR REPLACE PROCEDURE sp_assign_screen(
    p_group_id INT,
    p_screen_id INT,
    p_permissions JSONB DEFAULT '{"create":false,"read":true,"update":false,"delete":false}'
)
LANGUAGE plpgsql AS $$
DECLARE
    v_existing INT;
BEGIN
    SELECT id INTO v_existing FROM group_screens
    WHERE (data->>'group_id')::INT = p_group_id
    AND (data->>'screen_id')::INT = p_screen_id;

    IF v_existing IS NOT NULL THEN
        UPDATE group_screens SET data = jsonb_build_object(
            'group_id', p_group_id, 'screen_id', p_screen_id, 'permissions', p_permissions
        ) WHERE id = v_existing;
    ELSE
        INSERT INTO group_screens (data) VALUES (
            jsonb_build_object('group_id', p_group_id, 'screen_id', p_screen_id, 'permissions', p_permissions)
        );
    END IF;
END;
$$;

-- Ekran kaldirma procedure
CREATE OR REPLACE PROCEDURE sp_remove_screen(p_group_id INT, p_screen_id INT)
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM group_screens
    WHERE (data->>'group_id')::INT = p_group_id
    AND (data->>'screen_id')::INT = p_screen_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Atama bulunamadi: Grup %, Ekran %', p_group_id, p_screen_id;
    END IF;
END;
$$;

-- Kullanici olusturma procedure (validasyonlu)
CREATE OR REPLACE PROCEDURE sp_create_user(p_data JSONB)
LANGUAGE plpgsql AS $$
DECLARE
    v_username TEXT;
    v_existing INT;
BEGIN
    v_username := p_data->>'username';
    IF v_username IS NULL OR LENGTH(v_username) < 3 THEN
        RAISE EXCEPTION 'Kullanici adi en az 3 karakter olmali';
    END IF;
    SELECT id INTO v_existing FROM users WHERE data->>'username' = v_username;
    IF v_existing IS NOT NULL THEN
        RAISE EXCEPTION 'Bu kullanici adi zaten mevcut: %', v_username;
    END IF;
    INSERT INTO users (data) VALUES (p_data);
END;
$$;

-- Toplu ekran atama
CREATE OR REPLACE PROCEDURE sp_bulk_assign_screens(
    p_group_id INT, p_screen_ids INT[], p_permissions JSONB
)
LANGUAGE plpgsql AS $$
DECLARE
    v_screen_id INT;
BEGIN
    FOREACH v_screen_id IN ARRAY p_screen_ids LOOP
        CALL sp_assign_screen(p_group_id, v_screen_id, p_permissions);
    END LOOP;
END;
$$;
