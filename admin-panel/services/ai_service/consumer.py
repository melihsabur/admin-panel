import json
import asyncio
import os
import aio_pika
from datetime import datetime

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://rabbitmq_user:rabbitmq_pass@rabbitmq:5672/")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")

def analyze_text_file(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        word_count = len(content.split())
        line_count = len(content.splitlines())
        char_count = len(content)

        # Prompt komutlari varsa isle
        prompts = []
        for line in content.splitlines():
            stripped = line.strip()
            if stripped.startswith("PROMPT:") or stripped.startswith("SORU:"):
                prompt_text = stripped.split(":", 1)[1].strip()
                # Basit AI simulasyonu
                answer = simulate_ai_response(prompt_text)
                prompts.append({"prompt": prompt_text, "response": answer})

        return {
            "type": "text_analysis",
            "word_count": word_count,
            "line_count": line_count,
            "char_count": char_count,
            "prompts_found": len(prompts),
            "prompt_results": prompts,
            "summary": f"Dosya {line_count} satir, {word_count} kelime, {char_count} karakter iceriyor.",
            "analyzed_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {"type": "error", "message": str(e)}

def simulate_ai_response(prompt):
    prompt_lower = prompt.lower()
    if "merhaba" in prompt_lower or "selam" in prompt_lower:
        return "Merhaba! Size nasil yardimci olabilirim?"
    elif "hava" in prompt_lower:
        return "Hava durumu bilgisi icin meteoroloji servisine basvurmanizi oneririm."
    elif "tarih" in prompt_lower:
        return f"Bugunku tarih: {datetime.now().strftime('%d.%m.%Y')}"
    elif "hesapla" in prompt_lower or "toplam" in prompt_lower:
        return "Matematiksel islemler icin detayli bilgi veriniz."
    elif "ozet" in prompt_lower:
        return "Dosya basariyla analiz edildi. Icerik ozetleme islemi tamamlandi."
    else:
        return f"'{prompt}' komutu islendi. Sonuc basariyla uretildi. (Simulasyon modu)"

def convert_docx_to_html(filepath):
    try:
        from docx import Document
        doc = Document(filepath)

        html_parts = ['<!DOCTYPE html>', '<html lang="tr">', '<head>',
                      '<meta charset="UTF-8">', '<title>Donusturulmus Belge</title>',
                      '<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;}',
                      'h1{color:#1a1a2e;}h2{color:#16213e;}p{line-height:1.6;}</style>',
                      '</head>', '<body>']

        for para in doc.paragraphs:
            if para.style.name.startswith('Heading 1'):
                html_parts.append(f'<h1>{para.text}</h1>')
            elif para.style.name.startswith('Heading 2'):
                html_parts.append(f'<h2>{para.text}</h2>')
            elif para.style.name.startswith('Heading 3'):
                html_parts.append(f'<h3>{para.text}</h3>')
            elif para.text.strip():
                html_parts.append(f'<p>{para.text}</p>')

        html_parts.extend(['</body>', '</html>'])
        html_content = '\n'.join(html_parts)

        output_path = filepath.rsplit('.', 1)[0] + '.html'
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)

        return {
            "type": "docx_to_html",
            "success": True,
            "html_preview": html_content[:2000],
            "output_file": os.path.basename(output_path),
            "paragraph_count": len(doc.paragraphs),
            "converted_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {"type": "error", "success": False, "message": str(e)}

def analyze_image(filepath):
    file_size = os.path.getsize(filepath)
    ext = filepath.rsplit('.', 1)[-1].lower()
    return {
        "type": "image_analysis",
        "format": ext,
        "file_size_kb": round(file_size / 1024, 2),
        "analysis": "Gorsel analizi tamamlandi. (Simulasyon modu - Gercek analiz icin AI API entegrasyonu gerekli)",
        "analyzed_at": datetime.utcnow().isoformat()
    }

async def on_message(message: aio_pika.IncomingMessage):
    async with message.process():
        try:
            body = json.loads(message.body)
            print(f"[AI CONSUMER] Mesaj alindi: {body.get('action')}")

            action = body.get("action")
            response = {"success": False}

            if action == "ANALYZE":
                filename = body.get("filename", "")
                filepath = os.path.join(UPLOAD_DIR, filename)
                mime_type = body.get("mime_type", "")

                if not os.path.exists(filepath):
                    response = {"success": False, "error": "Dosya bulunamadi"}
                elif mime_type == "text/plain" or filename.endswith(".txt"):
                    analysis = analyze_text_file(filepath)
                    response = {"success": True, "analysis": analysis}
                elif filename.endswith(".docx"):
                    analysis = convert_docx_to_html(filepath)
                    response = {"success": True, "analysis": analysis}
                elif mime_type and mime_type.startswith("image/"):
                    analysis = analyze_image(filepath)
                    response = {"success": True, "analysis": analysis}
                else:
                    response = {
                        "success": True,
                        "analysis": {
                            "type": "general",
                            "message": f"Dosya tipi: {mime_type}. Genel analiz tamamlandi.",
                            "file_size_kb": round(os.path.getsize(filepath) / 1024, 2),
                            "analyzed_at": datetime.utcnow().isoformat()
                        }
                    }

            elif action == "PROMPT":
                prompt_text = body.get("prompt_text", "")
                result = simulate_ai_response(prompt_text)
                response = {"success": True, "result": result, "prompt": prompt_text}

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
                print(f"[AI RPC] Yanit gonderildi")

        except Exception as e:
            print(f"[AI CONSUMER HATA] {e}")

async def main():
    print("[AI SERVICE] Baslatiliyor...")
    for attempt in range(30):
        try:
            connection = await aio_pika.connect_robust(RABBITMQ_URL)
            channel = await connection.channel()
            queue = await channel.declare_queue("ai_queue", durable=True)
            await queue.consume(on_message)
            print("[AI SERVICE] Dinleniyor...")
            await asyncio.Future()
        except Exception as e:
            print(f"[AI SERVICE] Baglanti denemesi {attempt+1}/30: {e}")
            await asyncio.sleep(3)

if __name__ == "__main__":
    asyncio.run(main())
