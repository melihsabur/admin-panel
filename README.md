# Admin Panel - Cok Gruplu Yonetim Sistemi

Ogrenci, Okul ve Isletme gibi farkli gruplarin yonetilebilecegi, Supervisor tarafindan ekran ve yetki atamalarinin yapildigi, RabbitMQ ile mikroservis mimarisine sahip, AI destekli dosya analizi ve HTML editoru iceren kapsamli bir admin paneli.

## Mimari

```
Frontend (React + TailwindCSS) --> API Gateway (FastAPI) --> PostgreSQL (JSONB)
                                         |                --> Redis (Cache)
                                         |
                                    RabbitMQ (RPC)
                                         |
                              +-----------+-----------+
                              |           |           |
                         Log Service  File Service  AI Service
                         (Python)     (Python)      (Python/RAG)
```

## Docker Container Linkleri

| Servis | URL | Aciklama |
|--------|-----|----------|
| Frontend | http://localhost:3000 | React Admin Panel |
| Backend API | http://localhost:8000 | FastAPI REST API |
| API Docs (Swagger) | http://localhost:8000/docs | Otomatik API dokumantasyonu |
| RabbitMQ Management | http://localhost:15672 | RabbitMQ yonetim paneli |
| PostgreSQL | localhost:5432 | Veritabani |
| Redis | localhost:6379 | Cache servisi |

## Veritabani Bilgileri

| Parametre | Deger |
|-----------|-------|
| Host | localhost:5432 |
| Database | admin_panel_db |
| Kullanici | admin_user |
| Sifre | admin_pass_2024 |

## RabbitMQ Bilgileri

| Parametre | Deger |
|-----------|-------|
| Host | localhost:5672 |
| Management | localhost:15672 |
| Kullanici | rabbitmq_user |
| Sifre | rabbitmq_pass |

## Ornek Kullanici Bilgileri

| Kullanici Adi | Sifre | Rol | Grup |
|---------------|-------|-----|------|
| supervisor | super123 | Supervisor | Tum gruplara erisim |
| ogrenci1 | ogr123 | Kullanici | Ogrenci |
| ogrenci2 | ogr123 | Kullanici | Ogrenci |
| okul1 | okul123 | Kullanici | Okul |
| okul2 | okul123 | Kullanici | Okul |
| isletme1 | isl123 | Kullanici | Isletme |
| isletme2 | isl123 | Kullanici | Isletme |

## Hizli Baslangic

```bash
# Projeyi ayaga kaldirmak icin:
docker-compose up --build

# Arka planda calistirmak icin:
docker-compose up --build -d

# Durdurmak icin:
docker-compose down

# Volumeleri de silmek icin:
docker-compose down -v
```

## Kullanilan Teknolojiler

- **Frontend**: React 18, Vite, TailwindCSS, React Router, Axios, Lucide Icons
- **Backend**: FastAPI (Python 3.11), SQLAlchemy, Pydantic, python-jose (JWT)
- **Veritabani**: PostgreSQL 15 (JSONB), Redis 7
- **Mesaj Kuyrugu**: RabbitMQ 3 (RPC pattern)
- **AI Servisi**: RAG bilgi tabani, metin analizi, Word->HTML donusumu, prompt isleme
- **HTML Editoru**: GrapesJS benzeri split-view editor (Kod / Onizleme / Bolunmus)
- **Container**: Docker, Docker Compose
- **Diger**: aio-pika (async RabbitMQ), aiofiles, bcrypt, python-docx

## Proje Ozellikleri

1. **Cok Gruplu Yetki Sistemi**: Ogrenci, Okul, Isletme gruplari farkli ekranlara erisir
2. **Supervisor Kontrolu**: Ekran atama/kaldirma, CRUD yetki yonetimi
3. **Dosya Yonetimi**: Tip kisitlamasi (txt, png, jpg, jpeg, pdf, docx, xlsx), boyut limiti
4. **AI Analiz (RAG/MCP)**: Metin analizi, kelime frekansi, Word->HTML donusumu, prompt isleme, bilgi tabani sorgulama
5. **HTML Editoru (GrapesJS)**: DOCX->HTML donusumu sonrasi goruntusel HTML editoru, sablon destegi
6. **Tam Loglama**: Tum islemler loglanir, filtrelenebilir
7. **RabbitMQ RPC**: Islem sonuclari subscriber'lara bildirilir (correlation_id + reply_to)
8. **PostgreSQL JSONB**: Esnek veri yapisi (id, date, value), trigger/function/procedure
9. **Redis Cache**: Hizli erisim icin onbellekleme
10. **Docker**: Tek komutla 8 container ayaga kalkar
11. **Ornek Veriler**: Veritabaninda ornek image dosyalari (PNG) yuklu gelir

## Veritabani Yapisi (JSONB Pattern)

Tum tablolar asagidaki yapiyi kullanir:
- `id` (SERIAL, AUTO INCREMENT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `data` (JSONB) - Tum veriler JSON olarak tutulur

### Trigger'lar
- `trg_users_update_timestamp` - updated_at otomatik guncelleme
- `trg_audit_user_changes` - Kullanici degisikliklerini otomatik loglama
- `trg_audit_group_changes` - Grup degisikliklerini loglama
- `trg_audit_screen_assignment` - Ekran atama degisikliklerini loglama

### Function'lar
- `fn_get_group_screens(group_id)` - Grubun erisebilecegi ekranlari getirir
- `fn_check_permission(user_id, screen_slug, action)` - Yetki kontrolu yapar
- `fn_get_stats()` - Genel istatistikleri dondurur

### Procedure'lar
- `sp_assign_screen(group_id, screen_id, permissions)` - Ekran atama
- `sp_remove_screen(group_id, screen_id)` - Ekran kaldirma
- `sp_create_user(data)` - Validasyonlu kullanici olusturma
- `sp_bulk_assign_screens(group_id, screen_ids[], permissions)` - Toplu ekran atama

## RabbitMQ Kuyruk Yapisi

| Kuyruk | Tuketici | RPC | Aciklama |
|--------|----------|-----|----------|
| log_queue | Log Service | Evet | Tum islemlerin loglanmasi |
| file_queue | File Service | Evet | Dosya validasyonu ve yonetimi |
| ai_queue | AI Service | Evet | Dosya analizi ve prompt isleme |

## AI Servisi Yetenekleri

- **RAG Bilgi Tabani**: Python, Docker, React, FastAPI, PostgreSQL, RabbitMQ, Redis, TailwindCSS, JWT, Microservice konularinda bilgi sorgulama
- **Metin Analizi**: Kelime sayisi, cumle sayisi, kelime frekansi, ortalama kelime uzunlugu
- **Prompt Isleme**: PROMPT: ve SORU: ile baslayan satirlari isler
- **DOCX -> HTML**: Word dosyalarini stillendirilmis HTML'e donusturur (tablo destegi dahil)
- **Gorsel Analizi**: PNG boyut okuma, format tespiti
- **Matematik**: Basit hesaplamalar (toplama, cikarma, carpma, bolme)
- **Sistem Durumu**: Tum servislerin durum raporu

## GitHub

Proje kaynak kodu: [https://github.com/melihsabur/admin-panel](https://github.com/melihsabur/admin-panel)
