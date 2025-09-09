from datetime import datetime

from pydantic import BaseModel


class TenantBase(BaseModel):
    name: str


class TenantCreate(TenantBase):
    schema_name: str


class Tenant(TenantBase):
    id: int
    schema_name: str
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True
