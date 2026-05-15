from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import User
from schemas import UserCreate, UserUpdate
from auth import get_current_user, require_supervisor, hash_password
from rabbitmq import rabbitmq_client

router = APIRouter(prefix="/api/users", tags=["Kullanici Yonetimi"])

@router.get("/")
async def list_users(
    group_id: int = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(User).order_by(User.id)
    result = await db.execute(query)
    users = result.scalars().all()

    user_list = []
    for u in users:
        if group_id and u.data.get("group_id") != group_id:
            continue
        if current_user.data.get("role") != "supervisor":
            if u.data.get("group_id") != current_user.data.get("group_id"):
                continue
        user_info = {k: v for k, v in u.data.items() if k != "password_hash"}
        user_info["id"] = u.id
        user_info["created_at"] = str(u.created_at)
        user_list.append(user_info)

    return user_list

@router.get("/{user_id}")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanici bulunamadi")

    user_info = {k: v for k, v in user.data.items() if k != "password_hash"}
    user_info["id"] = user.id
    return user_info

@router.post("/")
async def create_user(request: UserCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_supervisor)):
    existing = await db.execute(select(User).where(User.data["username"].astext == request.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bu kullanici adi zaten mevcut")

    user_data = {
        "username": request.username,
        "password_hash": hash_password(request.password),
        "email": request.email,
        "full_name": request.full_name,
        "role": request.role,
        "group_id": request.group_id,
    }

    new_user = User(data=user_data)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    rpc_result = await rabbitmq_client.call("log_queue", {
        "action": "CREATE", "user_id": current_user.id,
        "entity_type": "user", "entity_id": new_user.id,
        "details": f"Yeni kullanici olusturuldu: {request.username}"
    })

    return {"message": "Kullanici olusturuldu", "user_id": new_user.id, "rpc_result": rpc_result}

@router.put("/{user_id}")
async def update_user(user_id: int, request: UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_supervisor)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanici bulunamadi")

    updated = dict(user.data)
    if request.email is not None:
        updated["email"] = request.email
    if request.full_name is not None:
        updated["full_name"] = request.full_name
    if request.group_id is not None:
        updated["group_id"] = request.group_id

    user.data = updated
    await db.commit()

    await rabbitmq_client.publish("log_queue", {
        "action": "UPDATE", "user_id": current_user.id,
        "entity_type": "user", "entity_id": user_id,
        "details": f"Kullanici guncellendi: {updated.get('username')}"
    })

    return {"message": "Kullanici guncellendi"}

@router.delete("/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_supervisor)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanici bulunamadi")

    username = user.data.get("username", "")
    await db.delete(user)
    await db.commit()

    await rabbitmq_client.publish("log_queue", {
        "action": "DELETE", "user_id": current_user.id,
        "entity_type": "user", "entity_id": user_id,
        "details": f"Kullanici silindi: {username}"
    })

    return {"message": "Kullanici silindi"}
