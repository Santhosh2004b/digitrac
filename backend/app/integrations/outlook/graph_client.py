import urllib.request
import json
import base64
import mimetypes
import os
import asyncio
from typing import Optional
from app.config import settings

class GraphClient:
    @staticmethod
    async def send_mail_async(
        access_token: str,
        sender_email: str,
        recipient_email: str,
        subject: str,
        html_body: str,
        attachment_path: Optional[str] = None
    ) -> bool:
        if access_token == "mock_access_token":
            print("\n[GRAPH API] ----------------------------------------------------")
            print(f"SENDER: {sender_email}")
            print(f"RECIPIENT: {recipient_email}")
            print(f"SUBJECT: {subject}")
            print(f"ATTACHMENT: {attachment_path if attachment_path and os.path.exists(attachment_path) else 'None'}")
            print(f"STATUS: Mock Dispatch Successful")
            print("----------------------------------------------------------------\n")
            return True

        send_url = f"https://graph.microsoft.com/v1.0/users/{sender_email}/sendMail"
        
        message_payload = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": html_body
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": recipient_email
                        }
                    }
                ]
            },
            "saveToSentItems": "true"
        }

        if attachment_path and os.path.exists(attachment_path):
            mime_type, _ = mimetypes.guess_type(attachment_path)
            with open(attachment_path, "rb") as f:
                b64_content = base64.b64encode(f.read()).decode("utf-8")
            
            message_payload["message"]["attachments"] = [
                {
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    "name": os.path.basename(attachment_path),
                    "contentType": mime_type or "application/octet-stream",
                    "contentBytes": b64_content
                }
            ]

        encoded_json = json.dumps(message_payload).encode("utf-8")

        def _send():
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            req = urllib.request.Request(send_url, data=encoded_json, headers=headers)
            with urllib.request.urlopen(req, timeout=15.0) as res:
                return res.status in [200, 202]

        try:
            return await asyncio.to_thread(_send)
        except Exception as e:
            print(f"[GRAPH API EXCEPTION] {str(e)}")
            return False
