import json
import asyncio
import os
import aio_pika

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://rabbitmq_user:rabbitmq_pass@rabbitmq:5672/")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")

ALLOWED_EXTENSIONS = {"txt", "png", "jpg", "jpeg", "pdf", "docx", "xlsx"}
MIME_MAP = {
    "txt": "text/plain", "png": "image/png", "jpg": "image/jpeg",
    "jpeg": "image/jpeg", "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

def validate_file(filename, mime_type):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Desteklenmeyen dosya tipi: {ext}"
    return True, "Dosya gecerli"

async def on_message(message: aio_pika.IncomingMessage):
    async with message.process():
        try:
            body = json.loads(message.body)
            print(f"[FILE CONSUMER] Mesaj alindi: {body.get('action')}")

            action = body.get("action")
            response = {"success": False}

            if action == "FILE_UPLOADED":
                is_valid, msg = validate_file(
                    body.get("original_name", ""),
                    body.get("mime_type", "")
                )
                response = {
                    "success": is_valid,
                    "message": msg,
                    "file_id": body.get("file_id"),
                    "validation": {
                        "filename": body.get("original_name"),
                        "mime_type": body.get("mime_type"),
                        "is_valid": is_valid
                    }
                }
            elif action == "DELETE_FILE":
                filepath = os.path.join(UPLOAD_DIR, body.get("filename", ""))
                if os.path.exists(filepath):
                    os.remove(filepath)
                    response = {"success": True, "message": "Dosya silindi"}
                else:
                    response = {"success": False, "message": "Dosya bulunamadi"}

            if message.reply_to:
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
                print(f"[FILE RPC] Yanit gonderildi: {response}")

        except Exception as e:
            print(f"[FILE CONSUMER HATA] {e}")

async def main():
    print("[FILE SERVICE] Baslatiliyor...")
    for attempt in range(30):
        try:
            connection = await aio_pika.connect_robust(RABBITMQ_URL)
            channel = await connection.channel()
            queue = await channel.declare_queue("file_queue", durable=True)
            await queue.consume(on_message)
            print("[FILE SERVICE] Dinleniyor...")
            await asyncio.Future()
        except Exception as e:
            print(f"[FILE SERVICE] Baglanti denemesi {attempt+1}/30: {e}")
            await asyncio.sleep(3)

if __name__ == "__main__":
    asyncio.run(main())
