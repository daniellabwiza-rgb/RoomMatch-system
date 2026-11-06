from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from ml_model import RoommateMatcher

app = FastAPI(title="RoomMatch ML & Matching API", version="1.0")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

matcher = RoommateMatcher(n_clusters=4)

class StudentProfile(BaseModel):
    id: str
    gender: str
    preferred_roommate_gender: str
    accommodation_type: str
    budget: float
    sleeping_schedule: str
    wakeup_schedule: str
    cleanliness: str
    study_habits: str
    noise_tolerance: str
    social_preference: str
    guest_preference: str
    smoking_preference: str
    pet_preference: str
    cooking_habits: str
    room_environment: str

class MatchRequest(BaseModel):
    student: StudentProfile
    candidates: List[StudentProfile]

@app.get("/")
def read_root():
    return {"message": "Welcome to the RoomMatch FastAPI Machine Learning Service!"}

@app.post("/api/match-roommates")
def match_roommates(payload: MatchRequest):
    """Filters candidates by gender/accommodation rules and runs compatibility scoring."""
    student = payload.student.dict()
    candidates = [c.dict() for c in payload.candidates]
    
    results = []
    for candidate in candidates:
        # 1. Apply Gender eligibility filter rule
        if student['preferred_roommate_gender'] != 'No preference':
            if candidate['gender'] != student['preferred_roommate_gender']:
                continue
        if candidate['preferred_roommate_gender'] != 'No preference':
            if student['gender'] != candidate['preferred_roommate_gender']:
                continue
                
        # 2. Calculate compatibility score
        score_data = matcher.calculate_compatibility(student, candidate)
        
        results.append({
            "matched_student_id": candidate['id'],
            **score_data
        })
        
    # Sort results from highest to lowest compatibility score
    results = sorted(results, key=lambda x: x['compatibility_score'], reverse=True)
    return {"matches": results}

@app.post("/api/train-model")
def train_model(students: List[StudentProfile]):
    """Endpoint for administrators to retrain the K-Modes clustering model."""
    data_list = [s.dict() for s in students]
    response = matcher.train_clusters(data_list)
    return response