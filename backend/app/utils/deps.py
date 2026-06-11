from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.config import settings
from app.models.user import User
from app.schemas.token import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.headers.get("Authorization")
    if token and token.startswith("Bearer "):
        token = token[7:]
    else:
        token = request.query_params.get("token")
        
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("id")
        user_role: str = payload.get("role")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(id=user_id, role=user_role)
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data.id).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_manager(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["MNG", "VP"]:
        raise HTTPException(status_code=403, detail="Not authorized. Manager or VP role required.")
    return current_user

def get_current_vp(current_user: User = Depends(get_current_user)):
    if current_user.role != "VP":
        raise HTTPException(status_code=403, detail="Not authorized. VP role required.")
    return current_user

def get_current_executive(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["MNG", "VP"]:
        raise HTTPException(status_code=403, detail="Not authorized. Manager or VP role required.")
    return current_user

def get_current_employee(current_user: User = Depends(get_current_user)):
    if current_user.role != "EMP":
        raise HTTPException(status_code=403, detail="Not authorized. Employee role required.")
    return current_user
