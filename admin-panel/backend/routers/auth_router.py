from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import User
from schemas import LoginRequest, TokenResponse, UserCreate
from auth import hash_password, verify_password, create_access_token, get_current_user
from rabbitmq import rabbitmq_client
import json

router = APIRouter(prefix="/api/auth", tags=["Kimlik Dogrulama"])

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.data["username"].astext == request.username)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Kullanici adi veya sifre hatali")

    if not verify_password(request.password, user.data.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Kullanici adi veya sifre hatali")

    token = create_access_token({"user_id": user.id, "role": user.data.get("role")})

    await rabbitmq_client.publish("log_queue", {
        "action": "LOGIN",
        "user_id": user.id,
        "entity_type": "auth",
        "details": f"{request.username} giris yapti"
    })

    user_info = {k: v for k, v in user.data.items() if k != "password_hash"}
    user_info["id"] = user.id

    return TokenResponse(access_token=token, user=user_info)

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    user_info = {k: v for k, v in current_user.data.items() if k != "password_hash"}
    user_info["id"] = current_user.id
    return user_info

@router.post("/register")
async def register(request: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where(User.data["username"].astext == request.username)
    )
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

    await rabbitmq_client.publish("log_queue", {
        "action": "REGISTER",
        "user_id": new_user.id,
        "entity_type": "user",
        "details": f"Yeni kullanici kaydoldu: {request.username}"
    })

    return {"message": "Kayit basarili", "user_id": new_user.id}
