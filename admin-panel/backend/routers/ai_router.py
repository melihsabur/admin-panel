import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import File, User
from schemas import AIAnalysisRequest
from auth import get_current_user
from rabbitmq import rabbitmq_client
from config import UPLOAD_DIR

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

@router.get("/html/{file_id}")
async def get_html_content(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(File).where(File.id == file_id))
    file = result.scalar_one_or_none()
    if not file:
        raise HTTPException(status_code=404, detail="Dosya bulunamadi")

    analysis = file.data.get("ai_analysis", {})
    if analysis and analysis.get("type") == "docx_to_html" and analysis.get("full_html"):
        return {"success": True, "html": analysis["full_html"], "filename": file.data.get("original_name")}

    filename = file.data.get("filename", "")
    html_filename = filename.rsplit('.', 1)[0] + '.html' if '.' in filename else ""
    html_path = os.path.join(UPLOAD_DIR, html_filename)

    if os.path.exists(html_path):
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        return {"success": True, "html": html_content, "filename": file.data.get("original_name")}

    raise HTTPException(status_code=404, detail="Bu dosya icin HTML donusumu bulunamadi. Once AI Analiz ile DOCX dosyasini donusturun.")

@router.put("/html/{file_id}")
async def save_html_content(
    file_id: int,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(File).where(File.id == file_id))
    file = result.scalar_one_or_none()
    if not file:
        raise HTTPException(status_code=404, detail="Dosya bulunamadi")

    html_content = body.get("html", "")
    filename = file.data.get("filename", "")
    html_filename = filename.rsplit('.', 1)[0] + '.html' if '.' in filename else f"{file_id}.html"
    html_path = os.path.join(UPLOAD_DIR, html_filename)

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    updated_data = dict(file.data)
    if "ai_analysis" in updated_data and updated_data["ai_analysis"]:
        updated_data["ai_analysis"]["full_html"] = html_content
        updated_data["ai_analysis"]["html_preview"] = html_content[:3000]
    file.data = updated_data
    await db.commit()

    await rabbitmq_client.publish("log_queue", {
        "action": "HTML_EDIT", "user_id": current_user.id,
        "entity_type": "file", "entity_id": file_id,
        "details": f"HTML duzenlendi (GrapesJS): {file.data.get('original_name')}"
    })

    return {"success": True, "message": "HTML kaydedildi"}
