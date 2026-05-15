-- Admin Panel Veritabani Baslangic

-- Kullanicilar tablosu
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Gruplar tablosu
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Ekranlar tablosu
CREATE TABLE IF NOT EXISTS screens (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Grup-Ekran iliskisi
CREATE TABLE IF NOT EXISTS group_screens (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Dosyalar tablosu
CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Loglar tablosu
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- JSONB icin GIN indexleri
CREATE INDEX idx_users_data ON users USING GIN (data);
CREATE INDEX idx_groups_data ON groups USING GIN (data);
CREATE INDEX idx_screens_data ON screens USING GIN (data);
CREATE INDEX idx_group_screens_data ON group_screens USING GIN (data);
CREATE INDEX idx_files_data ON files USING GIN (data);
CREATE INDEX idx_logs_data ON logs USING GIN (data);

-- Spesifik alan indexleri
CREATE INDEX idx_users_username ON users ((data->>'username'));
CREATE INDEX idx_users_role ON users ((data->>'role'));
CREATE INDEX idx_users_group_id ON users ((data->>'group_id'));
CREATE INDEX idx_logs_action ON logs ((data->>'action'));
CREATE INDEX idx_logs_user_id ON logs ((data->>'user_id'));

-- =====================
-- SEED DATA
-- =====================

-- Gruplar
INSERT INTO groups (data) VALUES
('{"name": "Ogrenci", "description": "Ogrenci grubu - universite ogrencileri icin", "settings": {"max_upload_size": 5242880, "allowed_file_types": ["txt","png","jpg","jpeg","pdf"]}}'),
('{"name": "Okul", "description": "Okul grubu - egitim kurumlari icin", "settings": {"max_upload_size": 10485760, "allowed_file_types": ["txt","png","jpg","jpeg","pdf","docx","xlsx"]}}'),
('{"name": "Isletme", "description": "Isletme grubu - sirketler icin", "settings": {"max_upload_size": 10485760, "allowed_file_types": ["txt","png","jpg","jpeg","pdf","docx","xlsx"]}}');

-- Ekranlar
INSERT INTO screens (data) VALUES
('{"name": "Dashboard", "slug": "dashboard", "component": "Dashboard", "description": "Genel istatistikler ve ozet bilgiler", "icon": "LayoutDashboard"}'),
('{"name": "Kullanici Listesi", "slug": "kullanici-listesi", "component": "UserList", "description": "Kullanicilari listeleme ve yonetme", "icon": "Users"}'),
('{"name": "Dosya Yonetimi", "slug": "dosya-yonetimi", "component": "FileUpload", "description": "Dosya yukleme, indirme ve yonetme", "icon": "FolderOpen"}'),
('{"name": "Raporlar", "slug": "raporlar", "component": "Reports", "description": "Sistem raporlari ve analizler", "icon": "BarChart3"}'),
('{"name": "AI Analiz", "slug": "ai-analiz", "component": "AIPanel", "description": "Yapay zeka ile dosya analizi", "icon": "Brain"}'),
('{"name": "Log Kayitlari", "slug": "log-kayitlari", "component": "LogViewer", "description": "Sistem log kayitlarini goruntuleme", "icon": "ScrollText"}');

-- Grup-Ekran atamalari (baslangic)
-- Ogrenci grubuna: Dashboard, Kullanici Listesi, Dosya Yonetimi
INSERT INTO group_screens (data) VALUES
('{"group_id": 1, "screen_id": 1, "permissions": {"create": false, "read": true, "update": false, "delete": false}}'),
('{"group_id": 1, "screen_id": 2, "permissions": {"create": false, "read": true, "update": false, "delete": false}}'),
('{"group_id": 1, "screen_id": 3, "permissions": {"create": true, "read": true, "update": false, "delete": false}}');

-- Okul grubuna: Dashboard, Kullanici Listesi, Dosya Yonetimi, Raporlar
INSERT INTO group_screens (data) VALUES
('{"group_id": 2, "screen_id": 1, "permissions": {"create": false, "read": true, "update": false, "delete": false}}'),
('{"group_id": 2, "screen_id": 2, "permissions": {"create": true, "read": true, "update": true, "delete": false}}'),
('{"group_id": 2, "screen_id": 3, "permissions": {"create": true, "read": true, "update": true, "delete": true}}'),
('{"group_id": 2, "screen_id": 4, "permissions": {"create": false, "read": true, "update": false, "delete": false}}');

-- Isletme grubuna: Dashboard, Kullanici Listesi, Dosya Yonetimi, Raporlar, AI Analiz
INSERT INTO group_screens (data) VALUES
('{"group_id": 3, "screen_id": 1, "permissions": {"create": true, "read": true, "update": true, "delete": false}}'),
('{"group_id": 3, "screen_id": 2, "permissions": {"create": true, "read": true, "update": true, "delete": true}}'),
('{"group_id": 3, "screen_id": 3, "permissions": {"create": true, "read": true, "update": true, "delete": true}}'),
('{"group_id": 3, "screen_id": 4, "permissions": {"create": true, "read": true, "update": true, "delete": false}}'),
('{"group_id": 3, "screen_id": 5, "permissions": {"create": true, "read": true, "update": false, "delete": false}}');

-- Kullanicilar (sifreler bcrypt ile hashlenecek, burada placeholder)
-- Gercek hash'ler backend uzerinden olusturulacak
INSERT INTO users (data) VALUES
('{"username": "supervisor", "password_hash": "$2b$12$LJ3m4ys3GZfnMRqYN0r8XOHYhU5JOqUbCVr8FnRkmJKvZPxcKsS9W", "email": "supervisor@admin.com", "role": "supervisor", "group_id": null, "full_name": "Sistem Yoneticisi"}'),
('{"username": "ogrenci1", "password_hash": "$2b$12$8KxUMFv7Zr6QjYp5GHxX5u0PvBnTgR4JxD8FmKsWvZPxcKsS9abc", "email": "ogrenci1@mail.com", "role": "user", "group_id": 1, "full_name": "Ahmet Yilmaz"}'),
('{"username": "ogrenci2", "password_hash": "$2b$12$8KxUMFv7Zr6QjYp5GHxX5u0PvBnTgR4JxD8FmKsWvZPxcKsS9def", "email": "ogrenci2@mail.com", "role": "user", "group_id": 1, "full_name": "Ayse Demir"}'),
('{"username": "okul1", "password_hash": "$2b$12$8KxUMFv7Zr6QjYp5GHxX5u0PvBnTgR4JxD8FmKsWvZPxcKsS9ghi", "email": "okul1@mail.com", "role": "user", "group_id": 2, "full_name": "Mehmet Kaya"}'),
('{"username": "okul2", "password_hash": "$2b$12$8KxUMFv7Zr6QjYp5GHxX5u0PvBnTgR4JxD8FmKsWvZPxcKsS9jkl", "email": "okul2@mail.com", "role": "user", "group_id": 2, "full_name": "Fatma Celik"}'),
('{"username": "isletme1", "password_hash": "$2b$12$8KxUMFv7Zr6QjYp5GHxX5u0PvBnTgR4JxD8FmKsWvZPxcKsS9mno", "email": "isletme1@mail.com", "role": "user", "group_id": 3, "full_name": "Ali Ozturk"}'),
('{"username": "isletme2", "password_hash": "$2b$12$8KxUMFv7Zr6QjYp5GHxX5u0PvBnTgR4JxD8FmKsWvZPxcKsS9pqr", "email": "isletme2@mail.com", "role": "user", "group_id": 3, "full_name": "Zeynep Arslan"}');

-- Ornek log kayitlari
INSERT INTO logs (data) VALUES
('{"action": "LOGIN", "user_id": 1, "group_id": null, "entity_type": "auth", "entity_id": null, "details": "Supervisor giris yapti", "ip_address": "192.168.1.1"}'),
('{"action": "CREATE", "user_id": 1, "group_id": null, "entity_type": "group", "entity_id": 1, "details": "Ogrenci grubu olusturuldu", "ip_address": "192.168.1.1"}'),
('{"action": "ASSIGN_SCREEN", "user_id": 1, "group_id": 1, "entity_type": "group_screen", "entity_id": 1, "details": "Dashboard ekrani Ogrenci grubuna atandi", "ip_address": "192.168.1.1"}');
