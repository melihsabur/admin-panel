# Admin Panel - Cok Gruplu Yonetim Sistemi

Ogrenci, Okul ve Isletme gibi farkli gruplarin yonetilebilecegi, Supervisor tarafindan ekran ve yetki atamalarinin yapildigi, RabbitMQ ile mikroservis mimarisine sahip, AI destekli dosya analizi iceren kapsamli bir admin paneli.

## Mimari

```
Frontend (React + TailwindCSS) --> API Gateway (FastAPI) --> PostgreSQL
                                         |                --> Redis (Cache)
                                         |
                                    RabbitMQ (RPC)
                                         |
                              +-----------+-----------+
                              |           |           |
                         Log Service  File Service  AI Service
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
- **AI Servisi**: python-docx (Word->HTML donusumu), metin analizi
- **Container**: Docker, Docker Compose
- **Diger**: aio-pika (async RabbitMQ), aiofiles, bcrypt

## Proje Ozellikleri

1. **Cok Gruplu Yetki Sistemi**: Ogrenci, Okul, Isletme gruplari farkli ekranlara erisir
2. **Supervisor Kontrolu**: Ekran atama/kaldirma, CRUD yetki yonetimi
3. **Dosya Yonetimi**: Tip kisitlamasi (txt, png, jpg, jpeg, pdf, docx, xlsx), boyut limiti
4. **AI Analiz**: Metin analizi, Word->HTML donusumu, prompt isleme
5. **Tam Loglama**: Tum islemler loglanir, filtrelenebilir
6. **RabbitMQ RPC**: Islem sonuclari subscriber'lara bildirilir
7. **PostgreSQL JSONB**: Esnek veri yapisi, trigger/function/procedure
8. **Redis Cache**: Hizli erisim icin onbellekleme
9. **Docker**: Tek komutla 8 container ayaga kalkar
