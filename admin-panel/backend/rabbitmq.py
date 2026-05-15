import json
import uuid
import asyncio
import aio_pika
from config import RABBITMQ_URL

class RabbitMQClient:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.callback_queue = None
        self.futures = {}

    async def connect(self):
        for attempt in range(10):
            try:
                self.connection = await aio_pika.connect_robust(RABBITMQ_URL)
                self.channel = await self.connection.channel()
                result = await self.channel.declare_queue("", exclusive=True)
                self.callback_queue = result
                await self.callback_queue.consume(self._on_response)
                print("RabbitMQ baglantisi basarili")
                return
            except Exception as e:
                print(f"RabbitMQ baglanti denemesi {attempt+1}/10: {e}")
                await asyncio.sleep(3)
        print("RabbitMQ'ya baglanilmadi, loglama devre disi")

    async def _on_response(self, message: aio_pika.IncomingMessage):
        async with message.process():
            correlation_id = message.correlation_id
            if correlation_id in self.futures:
                self.futures[correlation_id].set_result(json.loads(message.body))

    async def call(self, queue_name: str, message: dict, timeout: float = 10.0):
        if not self.channel:
            return {"success": False, "error": "RabbitMQ baglantisi yok"}

        correlation_id = str(uuid.uuid4())
        future = asyncio.get_event_loop().create_future()
        self.futures[correlation_id] = future

        await self.channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(message).encode(),
                correlation_id=correlation_id,
                reply_to=self.callback_queue.name,
            ),
            routing_key=queue_name,
        )

        try:
            result = await asyncio.wait_for(future, timeout=timeout)
            return result
        except asyncio.TimeoutError:
            self.futures.pop(correlation_id, None)
            return {"success": False, "error": "RPC timeout"}

    async def publish(self, queue_name: str, message: dict):
        if not self.channel:
            return
        await self.channel.default_exchange.publish(
            aio_pika.Message(body=json.dumps(message).encode()),
            routing_key=queue_name,
        )

    async def close(self):
        if self.connection:
            await self.connection.close()

rabbitmq_client = RabbitMQClient()
