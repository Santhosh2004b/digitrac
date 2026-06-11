import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\integrations\outlook\mail_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

email_logic = """
    @staticmethod
    async def send_escalation_alert_mail(
        project_name: str,
        recipient_email: str,
        trigger_reason: str,
        target_margin: float,
        current_margin: float
    ) -> bool:
        html_body = f\"\"\"
        <div style="font-family: 'Inter', sans-serif; background: #05070f; padding: 2rem; color: #fff;">
            <div style="border-left: 4px solid #ef4444; padding-left: 1rem; margin-bottom: 2rem;">
                <h2 style="color: #ef4444; margin: 0; letter-spacing: 0.1em; font-size: 1.2rem;">CRITICAL: MARGIN ESCALATION</h2>
                <div style="font-size: 0.7rem; color: #8896ab; margin-top: 0.5rem; font-weight: 700;">DIGITRAC × ARCHE GOVERNANCE</div>
            </div>
            <p style="font-size: 0.9rem; line-height: 1.6; color: #c8d6e5;">An automated margin escalation has been triggered for <strong>{project_name}</strong>.</p>
            <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); padding: 1.5rem; border-radius: 8px; margin: 2rem 0;">
                <p style="color: #ef4444; font-weight: 700;">Reason: {trigger_reason}</p>
                <div style="display: flex; gap: 2rem; margin-top: 1rem;">
                    <div>
                        <div style="font-size: 0.6rem; color: #8896ab; font-weight: 800;">TARGET MARGIN</div>
                        <div style="font-size: 1.2rem; font-weight: 900; color: #f59e0b;">{target_margin}%</div>
                    </div>
                    <div>
                        <div style="font-size: 0.6rem; color: #8896ab; font-weight: 800;">CURRENT MARGIN</div>
                        <div style="font-size: 1.2rem; font-weight: 900; color: #ef4444;">{current_margin}%</div>
                    </div>
                </div>
            </div>
            <p style="font-size: 0.8rem; color: #8896ab;">Please access the Coordinator Dashboard to review and action this escalation.</p>
        </div>
        \"\"\"
        subject = f"[ESCALATION] Margin Risk on {project_name}"
        access_token = await TokenManager.get_access_token()
        success = await GraphClient.send_mail_async(
            access_token=access_token,
            sender_email=settings.MICROSOFT_SENDER_EMAIL,
            recipient_email=recipient_email,
            subject=subject,
            html_body=html_body,
            attachment_path=None
        )
        return success
        
    @staticmethod
    async def send_workflow_request_mail(
        project_name: str,
        recipient_email: str,
        request_type: str,
        requested_by: str,
        reason: str
    ) -> bool:
        html_body = f\"\"\"
        <div style="font-family: 'Inter', sans-serif; background: #f8fafc; padding: 2rem; color: #0f172a;">
            <h2>Approval Required: {request_type.replace('_', ' ')}</h2>
            <p><strong>Project:</strong> {project_name}</p>
            <p><strong>Requested By:</strong> {requested_by}</p>
            <p><strong>Business Justification:</strong> {reason}</p>
            <p>Please review this request in the DigiTrac Approvals portal.</p>
        </div>
        \"\"\"
        subject = f"[APPROVAL REQUIRED] {request_type} - {project_name}"
        access_token = await TokenManager.get_access_token()
        success = await GraphClient.send_mail_async(
            access_token=access_token,
            sender_email=settings.MICROSOFT_SENDER_EMAIL,
            recipient_email=recipient_email,
            subject=subject,
            html_body=html_body,
            attachment_path=None
        )
        return success
"""

# Append to the end of class MailService
content = content + "\n" + email_logic

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\integrations\outlook\mail_service.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated MailService")
