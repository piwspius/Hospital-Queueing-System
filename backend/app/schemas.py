from pydantic import BaseModel
from datetime import datetime
from typing import List

class PatientCreate(BaseModel):
    name: str
    phone: str
    complaint: str

class Patient(BaseModel):
    id: int
    name: str
    phone: str
    complaint: str
    token: int
    created_at: datetime

    class Config:
        from_attributes = True
