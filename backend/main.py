from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from pydantic import BaseModel
from typing import List

SQLALCHEMY_DATABASE_URL = "sqlite:///./hospital_queue.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class PatientDB(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String)
    complaint = Column(String)
    token = Column(Integer, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


Base.metadata.create_all(bind=engine)


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

    model_config = {"from_attributes": True}


app = FastAPI(title="Hospital Queue System")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_next_token(db: Session):
    last_patient = db.query(PatientDB).order_by(PatientDB.token.desc()).first()
    return (last_patient.token + 1) if last_patient else 1


@app.post("/patients", response_model=Patient)
def add_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    """Add a new patient to the queue. Generates a token."""
    token = get_next_token(db)
    db_patient = PatientDB(
        name=patient.name, phone=patient.phone, complaint=patient.complaint, token=token
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


@app.get("/queue", response_model=List[Patient])
def get_queue(db: Session = Depends(get_db)):
    """Return all patients in the queue, ordered by token (arrival)."""
    patients = db.query(PatientDB).order_by(PatientDB.token).all()
    return patients


@app.post("/next", response_model=Patient)
def call_next(db: Session = Depends(get_db)):
    """Call the next patient (lowest token) and remove from queue."""
    patient = db.query(PatientDB).order_by(PatientDB.token).first()
    if not patient:
        raise HTTPException(status_code=404, detail="No patients in queue")
    db.delete(patient)
    db.commit()
    return patient


@app.delete("/patients/{patient_id}", response_model=Patient)
def remove_patient(patient_id: int, db: Session = Depends(get_db)):
    """Remove a specific patient (mark as served)."""
    patient = db.query(PatientDB).filter(PatientDB.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return patient
