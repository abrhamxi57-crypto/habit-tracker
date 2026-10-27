import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.guid import GUID

class SyncOperation(Base):
    __tablename__ = "sync_operations"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    client_operation_id = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False) # 'habit', 'schedule', 'completion', 'reminder'
    entity_id = Column(String(64), nullable=False, index=True)
    action = Column(String(20), nullable=False) # 'create', 'update', 'delete', 'toggle'
    status = Column(String(20), default="applied", nullable=False) # 'applied', 'conflict', 'rejected'
    payload = Column(Text, nullable=False)
    applied_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="sync_operations")

    __table_args__ = (
        Index("idx_sync_user_applied", "user_id", "applied_at"),
    )
