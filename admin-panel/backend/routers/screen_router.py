from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Screen, GroupScreen, User
from schemas import ScreenAssignment
from auth import get_current_user, require_supervisor
from rabbitmq import rabbitmq_client

router = APIRouter(prefix="/api/screens", tags=["Ekran Yonetimi"])

@router.get("/")
async def list_screens(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Screen).order_by(Screen.id))
    screens = result.scalars().all()
    return [{"id": s.id, **s.data} for s in screens]

@router.get("/group/{group_id}")
async def get_group_screens(group_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(GroupScreen).where(GroupScreen.data["group_id"].as_integer() == group_id)
    )
    assignments = result.scalars().all()

    screens_with_perms = []
    for gs in assignments:
        screen_result = await db.execute(
            select(Screen).where(Screen.id == int(gs.data.get("screen_id", 0)))
        )
        screen = screen_result.scalar_one_or_none()
        if screen:
            screens_with_perms.append({
                "assignment_id": gs.id,
                "screen_id": screen.id,
                "permissions": gs.data.get("permissions", {}),
                **screen.data
            })

    return screens_with_perms

@router.get("/my-screens")
async def get_my_screens(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.data.get("role") == "supervisor":
        result = await db.execute(select(Screen).order_by(Screen.id))
        screens = result.scalars().all()
        return [{
            "screen_id": s.id, **s.data,
            "permissions": {"create": True, "read": True, "update": True, "delete": True}
        } for s in screens]

    group_id = current_user.data.get("group_id")
    if not group_id:
        return []

    result = await db.execute(
        select(GroupScreen).where(GroupScreen.data["group_id"].as_integer() == int(group_id))
    )
    assignments = result.scalars().all()

    screens_list = []
    for gs in assignments:
        screen_result = await db.execute(
            select(Screen).where(Screen.id == int(gs.data.get("screen_id", 0)))
        )
        screen = screen_result.scalar_one_or_none()
        if screen:
            screens_list.append({
                "screen_id": screen.id,
                "permissions": gs.data.get("permissions", {}),
                **screen.data
            })

    return screens_list

@router.post("/assign")
async def assign_screen(request: ScreenAssignment, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_supervisor)):
    existing = await db.execute(
        select(GroupScreen).where(
            GroupScreen.data["group_id"].as_integer() == request.group_id,
            GroupScreen.data["screen_id"].as_integer() == request.screen_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bu ekran zaten bu gruba atanmis")

    gs_data = {
        "group_id": request.group_id,
        "screen_id": request.screen_id,
        "permissions": request.permissions
    }
    new_gs = GroupScreen(data=gs_data)
    db.add(new_gs)
    await db.commit()

    rpc_result = await rabbitmq_client.call("log_queue", {
        "action": "ASSIGN_SCREEN", "user_id": current_user.id,
        "group_id": request.group_id, "entity_type": "group_screen",
        "details": f"Ekran {request.screen_id} gruba {request.group_id} atandi"
    })

    return {"message": "Ekran atandi", "rpc_result": rpc_result}

@router.put("/assign/{assignment_id}")
async def update_assignment(assignment_id: int, request: ScreenAssignment, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_supervisor)):
    result = await db.execute(select(GroupScreen).where(GroupScreen.id == assignment_id))
    gs = result.scalar_one_or_none()
    if not gs:
        raise HTTPException(status_code=404, detail="Atama bulunamadi")

    gs.data = {"group_id": request.group_id, "screen_id": request.screen_id, "permissions": request.permissions}
    await db.commit()

    await rabbitmq_client.publish("log_queue", {
        "action": "UPDATE_PERMISSION", "user_id": current_user.id,
        "entity_type": "group_screen", "entity_id": assignment_id,
        "details": f"Ekran yetkileri guncellendi"
    })

    return {"message": "Yetkiler guncellendi"}

@router.delete("/assign/{assignment_id}")
async def remove_screen(assignment_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_supervisor)):
    result = await db.execute(select(GroupScreen).where(GroupScreen.id == assignment_id))
    gs = result.scalar_one_or_none()
    if not gs:
        raise HTTPException(status_code=404, detail="Atama bulunamadi")

    await db.delete(gs)
    await db.commit()

    await rabbitmq_client.publish("log_queue", {
        "action": "REMOVE_SCREEN", "user_id": current_user.id,
        "entity_type": "group_screen", "entity_id": assignment_id,
        "details": "Ekran atamasi kaldirildi"
    })

    return {"message": "Ekran atamasi kaldirildi"}
