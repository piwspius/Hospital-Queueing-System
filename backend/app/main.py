from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from database import engine, Base, get_db
from models import PatientDB
from schemas import PatientCreate, Patient

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hospital Queue System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_next_token(db: Session):
    last_patient = db.query(PatientDB).order_by(PatientDB.token.desc()).first()
    return (last_patient.token + 1) if last_patient else 1


@app.post("/patients", response_model=Patient)
def add_patient(patient: PatientCreate, db: Session = Depends(get_db)):
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
    patients = db.query(PatientDB).order_by(PatientDB.token).all()
    return patients


@app.post("/next", response_model=Patient)
def call_next(db: Session = Depends(get_db)):
    patient = db.query(PatientDB).order_by(PatientDB.token).first()
    if not patient:
        raise HTTPException(status_code=404, detail="No patients in queue")
    db.delete(patient)
    db.commit()
    return patient


@app.delete("/patients/{patient_id}", response_model=Patient)
def remove_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(PatientDB).filter(PatientDB.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return patient
