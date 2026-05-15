import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import File, User
from auth import get_current_user
from rabbitmq import rabbitmq_client
from config import UPLOAD_DIR, MAX_FILE_SIZE, ALLOWED_EXTENSIONS

router = APIRouter(prefix="/api/files", tags=["Dosya Yonetimi"])

def get_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

@router.post("/upload")
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ext = get_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Bu dosya tipi desteklenmiyor. Izin verilen tipler: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Dosya boyutu cok buyuk (max 10MB)")

    unique_name = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    file_data = {
        "filename": unique_name,
        "original_name": file.filename,
        "mime_type": file.content_type,
        "size": len(content),
        "uploader_id": current_user.id,
        "group_id": current_user.data.get("group_id"),
        "ai_analysis": None,
    }

    new_file = File(data=file_data)
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)

    rpc_result = await rabbitmq_client.call("file_queue", {
        "action": "FILE_UPLOADED",
        "file_id": new_file.id,
        "filename": unique_name,
        "original_name": file.filename,
        "mime_type": file.content_type,
        "uploader_id": current_user.id,
    })

    await rabbitmq_client.publish("log_queue", {
        "action": "UPLOAD", "user_id": current_user.id,
        "entity_type": "file", "entity_id": new_file.id,
        "details": f"Dosya yuklendi: {file.filename}"
    })

    return {"message": "Dosya yuklendi", "file_id": new_file.id, "filename": unique_name, "rpc_result": rpc_result}

@router.get("/")
async def list_files(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(File).order_by(File.id.desc()))
    files = result.scalars().all()

    file_list = []
    for f in files:
        if current_user.data.get("role") != "supervisor":
            if f.data.get("group_id") != current_user.data.get("group_id"):
                continue
        file_info = {**f.data, "id": f.id, "created_at": str(f.created_at)}
        file_list.append(file_info)

    return file_list

@router.delete("/{file_id}")
async def delete_file(file_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(File).where(File.id == file_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="Dosya bulunamadi")

    file_path = os.path.join(UPLOAD_DIR, f.data.get("filename", ""))
    if os.path.exists(file_path):
        os.remove(file_path)

    await db.delete(f)
    await db.commit()

    await rabbitmq_client.publish("log_queue", {
        "action": "DELETE", "user_id": current_user.id,
        "entity_type": "file", "entity_id": file_id,
        "details": f"Dosya silindi: {f.data.get('original_name')}"
    })

    return {"message": "Dosya silindi"}
