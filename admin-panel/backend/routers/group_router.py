from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Group, User
from schemas import GroupCreate, GroupUpdate
from auth import get_current_user, require_supervisor
from rabbitmq import rabbitmq_client

router = APIRouter(prefix="/api/groups", tags=["Grup Yonetimi"])

@router.get("/")
async def list_groups(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Group).order_by(Group.id))
    groups = result.scalars().all()
    return [{"id": g.id, "created_at": str(g.created_at), **g.data} for g in groups]

@router.get("/{group_id}")
async def get_group(group_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Grup bulunamadi")
    return {"id": group.id, "created_at": str(group.created_at), **group.data}

@router.post("/")
async def create_group(request: GroupCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_supervisor)):
    group_data = {"name": request.name, "description": request.description, "settings": request.settings}
    new_group = Group(data=group_data)
    db.add(new_group)
    await db.commit()
    await db.refresh(new_group)

    await rabbitmq_client.call("log_queue", {
        "action": "CREATE", "user_id": current_user.id,
        "entity_type": "group", "entity_id": new_group.id,
        "details": f"Yeni grup olusturuldu: {request.name}"
    })

    return {"id": new_group.id, **new_group.data}

@router.put("/{group_id}")
async def update_group(group_id: int, request: GroupUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_supervisor)):
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Grup bulunamadi")

    updated_data = dict(group.data)
    if request.name is not None:
        updated_data["name"] = request.name
    if request.description is not None:
        updated_data["description"] = request.description
    if request.settings is not None:
        updated_data["settings"] = request.settings

    group.data = updated_data
    await db.commit()

    await rabbitmq_client.call("log_queue", {
        "action": "UPDATE", "user_id": current_user.id,
        "entity_type": "group", "entity_id": group_id,
        "details": f"Grup guncellendi: {updated_data.get('name')}"
    })

    return {"id": group.id, **group.data}

@router.delete("/{group_id}")
async def delete_group(group_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_supervisor)):
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Grup bulunamadi")

    group_name = group.data.get("name", "")
    await db.delete(group)
    await db.commit()

    await rabbitmq_client.publish("log_queue", {
        "action": "DELETE", "user_id": current_user.id,
        "entity_type": "group", "entity_id": group_id,
        "details": f"Grup silindi: {group_name}"
    })

    return {"message": "Grup silindi"}
