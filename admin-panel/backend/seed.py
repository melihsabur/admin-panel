import asyncio
import sys
import os
import shutil
sys.path.insert(0, '/app')

from sqlalchemy import select, text
from database import async_session
from models import User, File
from auth import hash_password

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")
SAMPLE_DIR = "/app/sample_data"

async def seed():
    print("Seed islemi baslatiliyor...")
    async with async_session() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()

        password_map = {
            "supervisor": "super123",
            "ogrenci1": "ogr123",
            "ogrenci2": "ogr123",
            "okul1": "okul123",
            "okul2": "okul123",
            "isletme1": "isl123",
            "isletme2": "isl123",
        }

        for user in users:
            username = user.data.get("username")
            if username in password_map:
                new_hash = hash_password(password_map[username])
                updated_data = dict(user.data)
                updated_data["password_hash"] = new_hash
                user.data = updated_data
                print(f"  {username} sifresi guncellendi")

        await db.commit()
        print("Sifre seed islemi tamamlandi!")

        # Ornek image dosyalarini yukle
        await seed_sample_images(db)

async def seed_sample_images(db):
    print("Ornek image dosyalari kontrol ediliyor...")

    # Daha once yuklenip yuklenmedigini kontrol et
    result = await db.execute(select(File))
    existing_files = result.scalars().all()
    existing_names = [f.data.get("original_name", "") for f in existing_files]

    sample_files = [
        {
            "src": "sample_chart.png",
            "original_name": "ornek_grafik.png",
            "mime_type": "image/png",
        },
        {
            "src": "sample_team.png",
            "original_name": "ornek_takim.png",
            "mime_type": "image/png",
        },
    ]

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    for sf in sample_files:
        if sf["original_name"] in existing_names:
            print(f"  {sf['original_name']} zaten mevcut, atlaniyor")
            continue

        src_path = os.path.join(SAMPLE_DIR, sf["src"])
        if not os.path.exists(src_path):
            print(f"  {sf['src']} bulunamadi, atlaniyor")
            continue

        import uuid
        unique_name = f"{uuid.uuid4().hex}.png"
        dst_path = os.path.join(UPLOAD_DIR, unique_name)
        shutil.copy2(src_path, dst_path)
        file_size = os.path.getsize(dst_path)

        file_data = {
            "filename": unique_name,
            "original_name": sf["original_name"],
            "mime_type": sf["mime_type"],
            "size": file_size,
            "uploader_id": 1,
            "group_id": None,
            "ai_analysis": None,
        }

        new_file = File(data=file_data)
        db.add(new_file)
        print(f"  {sf['original_name']} yuklendi ({file_size} bytes)")

    await db.commit()
    print("Ornek image seed islemi tamamlandi!")

if __name__ == "__main__":
    asyncio.run(seed())
