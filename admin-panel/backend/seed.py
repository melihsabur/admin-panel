import asyncio
import sys
sys.path.insert(0, '/app')

from sqlalchemy import select, text
from database import async_session
from models import User
from auth import hash_password

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
        print("Seed islemi tamamlandi!")

if __name__ == "__main__":
    asyncio.run(seed())
