from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class GroupCreate(BaseModel):
    name: str
    description: str = ""
    settings: Dict[str, Any] = {}

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class ScreenAssignment(BaseModel):
    group_id: int
    screen_id: int
    permissions: Dict[str, bool] = {"create": False, "read": True, "update": False, "delete": False}

class UserCreate(BaseModel):
    username: str
    password: str
    email: str
    full_name: str
    role: str = "user"
    group_id: Optional[int] = None

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    group_id: Optional[int] = None

class AIAnalysisRequest(BaseModel):
    file_id: int
    analysis_type: str = "general"

class LogFilter(BaseModel):
    action: Optional[str] = None
    user_id: Optional[int] = None
    entity_type: Optional[str] = None
    limit: int = 50
    offset: int = 0
