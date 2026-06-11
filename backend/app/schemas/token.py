from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = None
    is_setup_complete: Optional[int] = None

class TokenData(BaseModel):
    id: Optional[int] = None
    role: Optional[str] = None
