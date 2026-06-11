import sys
import os
import requests
sys.path.insert(0, os.path.abspath('.'))

from app.db.session import SessionLocal
from app.models.user import User
from app.utils.security import create_access_token
from datetime import timedelta

def hit_api():
    db = SessionLocal()
    token = create_access_token(
        data={"sub": "manager@arche.global"}, expires_delta=timedelta(minutes=60)
    )
    db.close()
    
    url = "http://127.0.0.1:8000/manager/projects/34/items/0/log-hours"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"date": "2026-06-03", "hours": 1.0, "remarks": "Test"}
    
    response = requests.post(url, json=payload, headers=headers)
    print("STATUS:", response.status_code)
    print("RESPONSE:", response.text)

if __name__ == "__main__":
    hit_api()
