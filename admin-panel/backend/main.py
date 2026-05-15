from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from rabbitmq import rabbitmq_client
from redis_client import get_redis
from routers import auth_router, group_router, screen_router, user_router, file_router, log_router, ai_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Uygulama baslarken
    print("Uygulama baslatiliyor...")
    await rabbitmq_client.connect()
    await get_redis()

    # Seed islemini calistir (demo kullanici sifreleri)
    try:
        from seed import seed
        await seed()
    except Exception as e:
        print(f"Seed islemi hatasi (ilk calistirmada normal): {e}")

    print("Tum baglantilar hazir")
    yield
    # Uygulama kapanirken
    await rabbitmq_client.close()
    print("Uygulama kapatildi")

app = FastAPI(
    title="Admin Panel API",
    description="Cok Gruplu Admin Paneli - Mikroservis Mimarisi",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router'lari ekle
app.include_router(auth_router.router)
app.include_router(group_router.router)
app.include_router(screen_router.router)
app.include_router(user_router.router)
app.include_router(file_router.router)
app.include_router(log_router.router)
app.include_router(ai_router.router)

@app.get("/")
async def root():
    return {"message": "Admin Panel API calisiyor", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "ok"}
