-- =====================
-- TRIGGER TANIMLARI
-- =====================

-- 1) updated_at otomatik guncelleme trigger'i
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Her tabloya updated_at trigger'i ekle
CREATE TRIGGER trg_users_update_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_groups_update_timestamp
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_screens_update_timestamp
    BEFORE UPDATE ON screens
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_group_screens_update_timestamp
    BEFORE UPDATE ON group_screens
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_timestamp();

CREATE TRIGGER trg_files_update_timestamp
    BEFORE UPDATE ON files
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_timestamp();

-- 2) Kullanici degisikliklerini otomatik loglama
CREATE OR REPLACE FUNCTION fn_audit_user_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO logs (data) VALUES (
            jsonb_build_object(
                'action', 'CREATE',
                'user_id', NULL,
                'group_id', (NEW.data->>'group_id')::int,
                'entity_type', 'user',
                'entity_id', NEW.id,
                'details', 'Yeni kullanici olusturuldu: ' || (NEW.data->>'username'),
                'ip_address', '0.0.0.0',
                'triggered_by', 'database_trigger'
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO logs (data) VALUES (
            jsonb_build_object(
                'action', 'UPDATE',
                'user_id', NULL,
                'group_id', (NEW.data->>'group_id')::int,
                'entity_type', 'user',
                'entity_id', NEW.id,
                'details', 'Kullanici guncellendi: ' || (NEW.data->>'username'),
                'ip_address', '0.0.0.0',
                'old_data', OLD.data,
                'new_data', NEW.data,
                'triggered_by', 'database_trigger'
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO logs (data) VALUES (
            jsonb_build_object(
                'action', 'DELETE',
                'user_id', NULL,
                'group_id', (OLD.data->>'group_id')::int,
                'entity_type', 'user',
                'entity_id', OLD.id,
                'details', 'Kullanici silindi: ' || (OLD.data->>'username'),
                'ip_address', '0.0.0.0',
                'triggered_by', 'database_trigger'
            )
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_user_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION fn_audit_user_changes();

-- 3) Grup degisikliklerini loglama
CREATE OR REPLACE FUNCTION fn_audit_group_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO logs (data) VALUES (
            jsonb_build_object(
                'action', 'CREATE',
                'user_id', NULL,
                'entity_type', 'group',
                'entity_id', NEW.id,
                'details', 'Yeni grup olusturuldu: ' || (NEW.data->>'name'),
                'ip_address', '0.0.0.0',
                'triggered_by', 'database_trigger'
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO logs (data) VALUES (
            jsonb_build_object(
                'action', 'UPDATE',
                'user_id', NULL,
                'entity_type', 'group',
                'entity_id', NEW.id,
                'details', 'Grup guncellendi: ' || (NEW.data->>'name'),
                'ip_address', '0.0.0.0',
                'triggered_by', 'database_trigger'
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO logs (data) VALUES (
            jsonb_build_object(
                'action', 'DELETE',
                'user_id', NULL,
                'entity_type', 'group',
                'entity_id', OLD.id,
                'details', 'Grup silindi: ' || (OLD.data->>'name'),
                'ip_address', '0.0.0.0',
                'triggered_by', 'database_trigger'
            )
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_group_changes
    AFTER INSERT OR UPDATE OR DELETE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION fn_audit_group_changes();

-- 4) Ekran atama degisikliklerini loglama
CREATE OR REPLACE FUNCTION fn_audit_screen_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO logs (data) VALUES (
            jsonb_build_object(
                'action', 'ASSIGN_SCREEN',
                'user_id', NULL,
                'group_id', (NEW.data->>'group_id')::int,
                'entity_type', 'group_screen',
                'entity_id', NEW.id,
                'details', 'Ekran atandi - Grup: ' || (NEW.data->>'group_id') || ', Ekran: ' || (NEW.data->>'screen_id'),
                'ip_address', '0.0.0.0',
                'triggered_by', 'database_trigger'
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO logs (data) VALUES (
            jsonb_build_object(
                'action', 'REMOVE_SCREEN',
                'user_id', NULL,
                'group_id', (OLD.data->>'group_id')::int,
                'entity_type', 'group_screen',
                'entity_id', OLD.id,
                'details', 'Ekran kaldirildi - Grup: ' || (OLD.data->>'group_id') || ', Ekran: ' || (OLD.data->>'screen_id'),
                'ip_address', '0.0.0.0',
                'triggered_by', 'database_trigger'
            )
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_screen_assignment
    AFTER INSERT OR DELETE ON group_screens
    FOR EACH ROW
    EXECUTE FUNCTION fn_audit_screen_assignment();
