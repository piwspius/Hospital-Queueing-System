from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from .database import Base

class PatientDB(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String)
    complaint = Column(String)
    token = Column(Integer, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
