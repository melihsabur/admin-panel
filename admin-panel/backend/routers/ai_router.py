from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import File, User
from schemas import AIAnalysisRequest
from auth import get_current_user
from rabbitmq import rabbitmq_client

router = APIRouter(prefix="/api/ai", tags=["Yapay Zeka"])

@router.post("/analyze")
async def analyze_file(
    request: AIAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(File).where(File.id == request.file_id))
    file = result.scalar_one_or_none()
    if not file:
        raise HTTPException(status_code=404, detail="Dosya bulunamadi")

    rpc_result = await rabbitmq_client.call("ai_queue", {
        "action": "ANALYZE",
        "file_id": file.id,
        "filename": file.data.get("filename"),
        "original_name": file.data.get("original_name"),
        "mime_type": file.data.get("mime_type"),
        "analysis_type": request.analysis_type,
        "user_id": current_user.id,
    }, timeout=30.0)

    if rpc_result.get("success"):
        updated_data = dict(file.data)
        updated_data["ai_analysis"] = rpc_result.get("analysis")
        file.data = updated_data
        await db.commit()

    await rabbitmq_client.publish("log_queue", {
        "action": "AI_ANALYZE", "user_id": current_user.id,
        "entity_type": "file", "entity_id": file.id,
        "details": f"AI analizi yapildi: {file.data.get('original_name')}"
    })

    return rpc_result

@router.post("/prompt")
async def process_prompt(
    prompt: dict,
    current_user: User = Depends(get_current_user)
):
    rpc_result = await rabbitmq_client.call("ai_queue", {
        "action": "PROMPT",
        "prompt_text": prompt.get("text", ""),
        "user_id": current_user.id,
    }, timeout=30.0)

    await rabbitmq_client.publish("log_queue", {
        "action": "AI_PROMPT", "user_id": current_user.id,
        "entity_type": "ai",
        "details": "AI prompt islendi"
    })

    return rpc_result
