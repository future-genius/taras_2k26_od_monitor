from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel
from app.auth.rbac import require_role, UserRole

router = APIRouter(prefix="/students", tags=["Students"])

class StudentSchema(BaseModel):
    registerNumber: str
    name: str
    department: str
    year: str
    section: str
    className: str
    email: str
    phone: str
    tarasRole: str = "Member"
    status: str = "Active"

# In-memory data store for FastAPI backend demonstration
MOCK_DB_STUDENTS = [
    {
        "id": "std-001",
        "registerNumber": "24ECE001",
        "name": "Arun Kumar",
        "department": "ECE",
        "year": "III",
        "section": "A",
        "className": "ECE-A",
        "email": "arunkumar.ece@taras.edu",
        "phone": "+91 98765 43210",
        "tarasRole": "Coordinator",
        "status": "Active"
    },
    {
        "id": "std-002",
        "registerNumber": "24ECE002",
        "name": "Priya S",
        "department": "ECE",
        "year": "III",
        "section": "A",
        "className": "ECE-A",
        "email": "priyas.ece@taras.edu",
        "phone": "+91 98765 43211",
        "tarasRole": "Volunteer",
        "status": "Active"
    }
]

# READ - Accessible by PRESIDENT, STAFF, STUDENT
@router.get("/")
def get_students(
    search: Optional[str] = None,
    department: Optional[str] = None,
    year: Optional[str] = None,
    status: Optional[str] = None
):
    results = MOCK_DB_STUDENTS
    if search:
        q = search.lower()
        results = [s for s in results if q in s["name"].lower() or q in s["registerNumber"].lower()]
    if department and department != "ALL":
        results = [s for s in results if s["department"] == department]
    if year and year != "ALL":
        results = [s for s in results if s["year"] == year]
    if status and status != "ALL":
        results = [s for s in results if s["status"] == status]
    return results

# CREATE - ONLY PRESIDENT
@router.post("/", dependencies=[Depends(require_role([UserRole.PRESIDENT]))])
def create_student(student: StudentSchema):
    new_student = student.dict()
    new_student["id"] = f"std-{len(MOCK_DB_STUDENTS) + 1:03d}"
    MOCK_DB_STUDENTS.append(new_student)
    return new_student

# UPDATE - ONLY PRESIDENT
@router.put("/{student_id}", dependencies=[Depends(require_role([UserRole.PRESIDENT]))])
def update_student(student_id: str, student_update: StudentSchema):
    for idx, s in enumerate(MOCK_DB_STUDENTS):
        if s["id"] == student_id or s["registerNumber"] == student_id:
            MOCK_DB_STUDENTS[idx] = {**s, **student_update.dict()}
            return MOCK_DB_STUDENTS[idx]
    raise HTTPException(status_code=404, detail="Student not found")

# DEACTIVATE / DELETE - ONLY PRESIDENT
@router.delete("/{student_id}", dependencies=[Depends(require_role([UserRole.PRESIDENT]))])
def deactivate_student(student_id: str):
    for idx, s in enumerate(MOCK_DB_STUDENTS):
        if s["id"] == student_id or s["registerNumber"] == student_id:
            MOCK_DB_STUDENTS[idx]["status"] = "Inactive"
            return {"message": "Student deactivated successfully", "student": MOCK_DB_STUDENTS[idx]}
    raise HTTPException(status_code=404, detail="Student not found")
