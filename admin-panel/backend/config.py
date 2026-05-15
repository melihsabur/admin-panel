import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://admin_user:admin_pass_2024@postgres:5432/admin_panel_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://rabbitmq_user:rabbitmq_pass@rabbitmq:5672/")
SECRET_KEY = os.getenv("SECRET_KEY", "gizli_anahtar_proje_2024_admin_panel")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))

ALLOWED_EXTENSIONS = {"txt", "png", "jpg", "jpeg", "pdf", "docx", "xlsx"}
