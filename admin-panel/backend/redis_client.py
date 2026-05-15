import redis.asyncio as redis
from config import REDIS_URL

redis_client = None

async def get_redis():
    global redis_client
    if redis_client is None:
        for attempt in range(10):
            try:
                redis_client = redis.from_url(REDIS_URL, decode_responses=True)
                await redis_client.ping()
                print("Redis baglantisi basarili")
                return redis_client
            except Exception as e:
                print(f"Redis baglanti denemesi {attempt+1}/10: {e}")
                import asyncio
                await asyncio.sleep(2)
        print("Redis'e baglanilmadi")
    return redis_client

async def cache_get(key: str):
    r = await get_redis()
    if r:
        return await r.get(key)
    return None

async def cache_set(key: str, value: str, expire: int = 300):
    r = await get_redis()
    if r:
        await r.set(key, value, ex=expire)

async def cache_delete(key: str):
    r = await get_redis()
    if r:
        await r.delete(key)
