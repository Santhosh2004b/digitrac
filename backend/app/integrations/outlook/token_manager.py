import urllib.request
import urllib.parse
import json
import asyncio
from app.config import settings

class TokenManager:
    @staticmethod
    async def get_access_token() -> str:
        if not settings.MICROSOFT_CLIENT_ID or not settings.MICROSOFT_CLIENT_SECRET or not settings.MICROSOFT_TENANT_ID:
            print("[GRAPH TOKEN] Warning: Microsoft Graph API credentials not fully configured. Using mock token.")
            return "mock_access_token"
        
        token_url = f"https://login.microsoftonline.com/{settings.MICROSOFT_TENANT_ID}/oauth2/v2.0/token"
        data = {
            "client_id": settings.MICROSOFT_CLIENT_ID,
            "client_secret": settings.MICROSOFT_CLIENT_SECRET,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials"
        }
        encoded_data = urllib.parse.urlencode(data).encode("utf-8")
        
        def _fetch():
            req = urllib.request.Request(token_url, data=encoded_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
            with urllib.request.urlopen(req, timeout=10.0) as res:
                return json.loads(res.read().decode("utf-8"))

        try:
            result = await asyncio.to_thread(_fetch)
            return result.get("access_token", "mock_access_token")
        except Exception as e:
            print(f"[GRAPH TOKEN EXCEPTION] {str(e)}")
            return "mock_access_token"
