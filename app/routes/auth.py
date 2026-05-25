from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin
from app.schemas.token import Token
from app.utils.security import get_password_hash, verify_password, create_access_token
from app.utils.deps import get_current_user
from pydantic import BaseModel

class SetupRequest(BaseModel):
    email: str
    password: str

class CheckNewRequest(BaseModel):
    email: str

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if not user_in.email.endswith("@arche.global"):
        raise HTTPException(status_code=400, detail="Only Arche Global enterprise identities are allowed.")
        
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password=hashed_password,
        role=user_in.role,
        is_setup_complete=1 # Registered users are already set up
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"id": user.id, "role": user.role})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": user.role,
        "is_setup_complete": user.is_setup_complete
    }

@router.post("/setup")
def setup_account(req: SetupRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Identity not found.")
    
    if user.is_setup_complete:
        raise HTTPException(status_code=400, detail="Account already activated.")
        
    user.password = get_password_hash(req.password)
    user.is_setup_complete = 1
    db.commit()
    return {"status": "Account activated successfully."}

@router.post("/verify-new")
def verify_new_member(req: CheckNewRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Identity not found. A VP must deploy a mission to this email first.")
    
    if user.is_setup_complete:
        raise HTTPException(status_code=400, detail="This account is already initialized. Please switch to 'Existing Member' to login.")
        
    return {"status": "SUCCESS", "email": user.email, "name": user.name}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
