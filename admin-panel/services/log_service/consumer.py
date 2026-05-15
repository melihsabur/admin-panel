import json
import asyncio
import os
import aio_pika
import psycopg2
from datetime import datetime

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://rabbitmq_user:rabbitmq_pass@rabbitmq:5672/")
DB_HOST = os.getenv("DB_HOST", "postgres")
DB_NAME = os.getenv("POSTGRES_DB", "admin_panel_db")
DB_USER = os.getenv("POSTGRES_USER", "admin_user")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "admin_pass_2024")

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)

def save_log(log_data):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO logs (data) VALUES (%s) RETURNING id", (json.dumps(log_data),))
        log_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        print(f"[LOG] Kaydedildi: id={log_id}, action={log_data.get('action')}")
        return log_id
    except Exception as e:
        print(f"[LOG HATA] {e}")
        return None

async def on_message(message: aio_pika.IncomingMessage):
    async with message.process():
        try:
            body = json.loads(message.body)
            print(f"[LOG CONSUMER] Mesaj alindi: {body.get('action', 'N/A')}")

            log_data = {
                "action": body.get("action", "UNKNOWN"),
                "user_id": body.get("user_id"),
                "group_id": body.get("group_id"),
                "entity_type": body.get("entity_type"),
                "entity_id": body.get("entity_id"),
                "details": body.get("details", ""),
                "ip_address": body.get("ip_address", "0.0.0.0"),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "rabbitmq_consumer"
            }

            log_id = save_log(log_data)

            # RPC yaniti gonder
            if message.reply_to:
                response = {"success": log_id is not None, "log_id": log_id}
                if log_id is None:
                    response["error"] = "Log kaydedilemedi"

                connection = await aio_pika.connect_robust(RABBITMQ_URL)
                channel = await connection.channel()
                await channel.default_exchange.publish(
                    aio_pika.Message(
                        body=json.dumps(response).encode(),
                        correlation_id=message.correlation_id,
                    ),
                    routing_key=message.reply_to,
                )
                await connection.close()
                print(f"[LOG RPC] Yanit gonderildi: {response}")

        except Exception as e:
            print(f"[LOG CONSUMER HATA] {e}")

async def main():
    print("[LOG SERVICE] Baslatiliyor...")
    for attempt in range(30):
        try:
            connection = await aio_pika.connect_robust(RABBITMQ_URL)
            channel = await connection.channel()
            queue = await channel.declare_queue("log_queue", durable=True)
            await queue.consume(on_message)
            print("[LOG SERVICE] Dinleniyor...")
            await asyncio.Future()
        except Exception as e:
            print(f"[LOG SERVICE] Baglanti denemesi {attempt+1}/30: {e}")
            await asyncio.sleep(3)

if __name__ == "__main__":
    asyncio.run(main())
