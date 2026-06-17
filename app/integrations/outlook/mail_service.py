import os
from datetime import datetime
from typing import Optional
from app.config import settings
from app.integrations.outlook.token_manager import TokenManager
from app.integrations.outlook.graph_client import GraphClient

class MailService:
    @staticmethod
    async def send_mission_assignment_mail(
        mission_name: str,
        assigned_by: str,
        recipient_email: str,
        artifact_path: Optional[str] = None,
        deadline: str = "TBD",
        mission_id: str = "REF-1001",
        manager_name: str = "Manager",
        sender_email: Optional[str] = None
    ) -> bool:
        template_path = os.path.join(os.path.dirname(__file__), "templates", "mission_assignment.html")
        if os.path.exists(template_path):
            with open(template_path, "r", encoding="utf-8") as f:
                html_body = f.read()
            html_body = html_body.replace("{{mission_name}}", mission_name)
            html_body = html_body.replace("{{assigned_by}}", assigned_by)
            html_body = html_body.replace("{{deadline}}", deadline)
            html_body = html_body.replace("{{mission_id}}", str(mission_id))
            html_body = html_body.replace("{{manager_name}}", manager_name)
        else:
            html_body = f"""
            <h3>Hello {manager_name},</h3>
            <p>You have been assigned a new project in DigiTrac.</p>
            <p>Project: {mission_name}</p>
            <p>Assigned By: VP Dashboard</p>
            <p>Deadline: {deadline}</p>
            <p>Project Reference: {mission_id}</p>
            <p>Please login to DigiTrac portal: https://digitrac.arche.global/login</p>
            """

        subject = f"[DigiTrac] New Project Assigned"
        access_token = await TokenManager.get_access_token()
        
        success = await GraphClient.send_mail_async(
            access_token=access_token,
            sender_email=sender_email or settings.MICROSOFT_SENDER_EMAIL,
            recipient_email=recipient_email,
            subject=subject,
            html_body=html_body,
            attachment_path=artifact_path
        )
        return success

    @staticmethod
    async def send_deadline_alert_mail(
        mission_name: str,
        recipient_email: str,
        days_left: int,
        margin_target: float,
        manager_name: str = "Manager"
    ) -> bool:
        html_body = f"""
        <div style="font-family: 'Inter', sans-serif; background: #05070f; padding: 2rem; color: #fff;">
            <div style="border-left: 4px solid #ef4444; padding-left: 1rem; margin-bottom: 2rem;">
                <h2 style="color: #ef4444; margin: 0; letter-spacing: 0.1em; font-size: 1.2rem;">ALERT: PROJECT DEADLINE APPROACHING</h2>
                <div style="font-size: 0.7rem; color: #8896ab; margin-top: 0.5rem; font-weight: 700;">DIGITRAC × ARCHE</div>
            </div>
            
            <p style="font-size: 0.9rem; line-height: 1.6; color: #c8d6e5;">Hello <strong>{manager_name}</strong>,</p>
            <p style="font-size: 0.9rem; line-height: 1.6; color: #c8d6e5;">This is an automated alert. The deadline for your project <strong>{mission_name}</strong> is approaching.</p>
            
            <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); padding: 1.5rem; border-radius: 8px; margin: 2rem 0;">
                <div style="margin-bottom: 1rem;">
                    <div style="font-size: 0.6rem; color: #8896ab; font-weight: 800; letter-spacing: 0.05em;">TIME REMAINING</div>
                    <div style="font-size: 1.8rem; font-weight: 900; color: #ef4444;">{days_left} Days</div>
                </div>
                <div>
                    <div style="font-size: 0.6rem; color: #8896ab; font-weight: 800; letter-spacing: 0.05em;">MARGIN TARGET</div>
                    <div style="font-size: 1.2rem; font-weight: 900; color: #f59e0b;">{margin_target}%</div>
                </div>
            </div>
            
            <p style="font-size: 0.8rem; color: #8896ab;">Please review your resource plan to ensure we stay on track with the target margin.</p>
        </div>
        """

        subject = f"[URGENT] {days_left} Days Left: {mission_name} Deadline"
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
    async def send_utilization_alert_mail(
        subject: str,
        mission_name: str,
        recipient_email: str,
        customer_name: str,
        pm_name: str,
        elapsed_days: int,
        remaining_days: int,
        target_margin: float,
        current_margin: float,
        forecast_margin: float,
        actual_cost: float
    ) -> bool:
        html_body = f"""
        <div style="font-family: 'Inter', sans-serif; background: #05070f; padding: 2rem; color: #fff;">
            <h2>{subject}</h2>
            <p><strong>Project:</strong> {mission_name}</p>
            <p><strong>Customer:</strong> {customer_name}</p>
            <p><strong>PM:</strong> {pm_name}</p>
            <p><strong>Elapsed Days:</strong> {elapsed_days}</p>
            <p><strong>Remaining Days:</strong> {remaining_days}</p>
            <p><strong>Target Margin:</strong> {target_margin}%</p>
            <p><strong>Current Margin:</strong> {current_margin}%</p>
            <p><strong>Forecast Margin:</strong> {forecast_margin}%</p>
            <p><strong>Actual Cost:</strong> {actual_cost}</p>
        </div>
        """
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
    async def send_buffer_expiry_mail(
        project_name: str,
        recipient_email: str,
        project_id: int
    ) -> bool:
        # PM login redirect URL for the popup
        login_url = f"https://digitrac.arche.global/login?redirect=/manager/dashboard?popup={project_id}"
        html_body = f"""
        <div style="font-family: 'Inter', sans-serif; background: #05070f; padding: 2rem; color: #fff;">
            <h2>Buffer Period Completed</h2>
            <p>The buffer period for project <strong>{project_name}</strong> has expired.</p>
            <p>Please choose an action below:</p>
            <a href="{login_url}" style="padding: 10px 20px; background: #22c55e; color: white; text-decoration: none; border-radius: 4px; display: inline-block; margin-right: 10px;">START PROJECT</a>
            <a href="{login_url}" style="padding: 10px 20px; background: #eab308; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">EXTEND BUFFER</a>
        </div>
        """
        access_token = await TokenManager.get_access_token()
        success = await GraphClient.send_mail_async(
            access_token=access_token,
            sender_email=settings.MICROSOFT_SENDER_EMAIL,
            recipient_email=recipient_email,
            subject=f"BUFFER EXPIRED: {project_name}",
            html_body=html_body,
            attachment_path=None
        )
        return success

    @staticmethod
    async def send_escalation_alert_mail(
        project_name: str,
        recipient_email: str,
        trigger_reason: str,
        target_margin: float,
        current_margin: float
    ) -> bool:
        html_body = f"""
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
        """
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
    async def send_project_hold_mail(
        project_name: str,
        recipient_email: str,
        customer_name: str,
        pm_name: str,
        buffer_duration: str,
        reason: str,
        expected_resume_date: str,
        is_site_hold: bool = False
    ) -> bool:
        subject_str = "PROJECT DELAY NOTIFICATION" if is_site_hold else "PROJECT ON HOLD"
        
        html_body = f"""
        <div style="font-family: 'Inter', sans-serif; background: #05070f; padding: 2rem; color: #fff;">
            <h2>{subject_str}</h2>
            <p><strong>Project:</strong> {project_name}</p>
            <p><strong>Customer:</strong> {customer_name}</p>
            <p><strong>PM:</strong> {pm_name}</p>
            <p><strong>Reason:</strong> {reason}</p>
            <p><strong>Buffer Duration:</strong> {buffer_duration}</p>
            <p><strong>Expected Resume Date:</strong> {expected_resume_date}</p>
        </div>
        """
        access_token = await TokenManager.get_access_token()
        success = await GraphClient.send_mail_async(
            access_token=access_token,
            sender_email=settings.MICROSOFT_SENDER_EMAIL,
            recipient_email=recipient_email,
            subject=subject_str,
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
        html_body = f"""
        <div style="font-family: 'Inter', sans-serif; background: #f8fafc; padding: 2rem; color: #0f172a;">
            <h2>Approval Required: {request_type.replace('_', ' ')}</h2>
            <p><strong>Project:</strong> {project_name}</p>
            <p><strong>Requested By:</strong> {requested_by}</p>
            <p><strong>Business Justification:</strong> {reason}</p>
            <p>Please review this request in the DigiTrac Approvals portal.</p>
        </div>
        """
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
