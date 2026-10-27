from typing import List, Optional, Any
from pydantic import BaseModel
from app.schemas.habit import HabitResponse
from app.schemas.log import LogResponse

class SyncMutation(BaseModel):
    id: str
    entity_type: str # 'habit' or 'log'
    entity_id: str
    action: str # 'create', 'update', 'delete'
    payload: str
    timestamp: str

class BatchSyncRequest(BaseModel):
    last_sync_timestamp: Optional[str] = None
    mutations: Optional[List[SyncMutation]] = []
    habits: Optional[List[dict]] = []
    logs: Optional[List[dict]] = []

class BatchSyncResponse(BaseModel):
    success: bool
    server_timestamp: str
    applied_count: int
    server_habits: List[HabitResponse]
    server_logs: List[LogResponse]
    conflicts_resolved: int = 0
