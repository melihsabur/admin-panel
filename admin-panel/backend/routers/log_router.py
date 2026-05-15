from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Log, User
from auth import get_current_user

router = APIRouter(prefix="/api/logs", tags=["Log Yonetimi"])

@router.get("/")
async def list_logs(
    action: str = None,
    user_id: int = None,
    entity_type: str = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Log).order_by(Log.id.desc())

    result = await db.execute(query)
    logs = result.scalars().all()

    log_list = []
    for log in logs:
        if action and log.data.get("action") != action:
            continue
        if user_id and log.data.get("user_id") != user_id:
            continue
        if entity_type and log.data.get("entity_type") != entity_type:
            continue
        log_list.append({
            "id": log.id,
            "created_at": str(log.created_at),
            **log.data
        })

    return log_list[offset:offset + limit]

@router.get("/stats")
async def log_stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(text("SELECT fn_get_stats()"))
    stats = result.scalar()
    return stats
