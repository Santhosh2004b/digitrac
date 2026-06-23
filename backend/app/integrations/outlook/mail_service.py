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
        manager_name: str = "Manager"
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
            sender_email=settings.MICROSOFT_SENDER_EMAIL,
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
    async def send_variance_alert_mail(
        mission_name: str,
        resource_name: str,
        variance_pct: float,
        actual_pct: float,
        expected_pct: float,
        health_status: str,
        recipient_emails: list,
        planned_months: float = 0.0,
        elapsed_months: float = 0.0
    ) -> bool:
        color = "#10b981" if variance_pct >= 0 else "#ef4444"
        variance_str = f"+{variance_pct}%" if variance_pct > 0 else f"{variance_pct}%"
        
        balance_months = round(max(0.0, planned_months - elapsed_months), 1)
        remaining_work = max(0.0, 100 - actual_pct)
        
        brief_explanation = f"The actual progress is currently at <strong>{actual_pct}%</strong> against an expected progress of <strong>{expected_pct}%</strong> based on the timeline. We have elapsed {elapsed_months} months out of the planned {planned_months} months, leaving a balance time of <strong>{balance_months} months</strong> to complete the remaining {remaining_work}% of the work."
        
        html_body = f"""
        <div style="font-family: 'Inter', sans-serif; background: #05070f; padding: 2rem; color: #fff;">
            <div style="border-left: 4px solid {color}; padding-left: 1rem; margin-bottom: 2rem;">
                <h2 style="color: {color}; margin: 0; letter-spacing: 0.1em; font-size: 1.2rem;">VARIANCE ALERT: {variance_str}</h2>
                <div style="font-size: 0.7rem; color: #8896ab; margin-top: 0.5rem; font-weight: 700;">DIGITRAC × ARCHE</div>
            </div>
            
            <p style="font-size: 0.9rem; line-height: 1.6; color: #c8d6e5;">This is an automated intelligence update. A significant progress variance has been recorded.</p>
            
            <p style="font-size: 0.9rem; line-height: 1.6; color: #e2e8f0; background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 8px; border-left: 3px solid #3b82f6;">{brief_explanation}</p>
            
            <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 1.5rem; border-radius: 8px; margin: 2rem 0;">
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 1.5rem;">
                    <tr>
                        <td style="padding-bottom: 1rem;">
                            <div style="font-size: 0.6rem; color: #8896ab; font-weight: 800; letter-spacing: 0.05em;">PROJECT</div>
                            <div style="font-size: 1.2rem; font-weight: 900; color: #fff;">{mission_name}</div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div style="font-size: 0.6rem; color: #8896ab; font-weight: 800; letter-spacing: 0.05em;">RESOURCE / INDIVIDUAL</div>
                            <div style="font-size: 1rem; font-weight: 600; color: #e2e8f0;">{resource_name}</div>
                        </td>
                    </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td width="33%" valign="top">
                            <div style="font-size: 0.6rem; color: #8896ab; font-weight: 800; letter-spacing: 0.05em;">ACTUAL</div>
                            <div style="font-size: 1.2rem; font-weight: 900; color: #fff;">{actual_pct}%</div>
                        </td>
                        <td width="33%" valign="top">
                            <div style="font-size: 0.6rem; color: #8896ab; font-weight: 800; letter-spacing: 0.05em;">EXPECTED</div>
                            <div style="font-size: 1.2rem; font-weight: 900; color: #fff;">{expected_pct}%</div>
                        </td>
                        <td width="33%" valign="top">
                            <div style="font-size: 0.6rem; color: #8896ab; font-weight: 800; letter-spacing: 0.05em;">HEALTH</div>
                            <div style="font-size: 1.2rem; font-weight: 900; color: {color};">{health_status}</div>
                        </td>
                    </tr>
                </table>
            </div>
            
            <p style="font-size: 0.8rem; color: #8896ab;">Please review the Resource Utilization Breakdown in the Coordinator Dashboard.</p>
        </div>
        """

        subject = f"[Variance {variance_str}] {mission_name} Update"
        access_token = await TokenManager.get_access_token()
        
        all_success = True
        for email in recipient_emails:
            # Filter out known invalid accounts to prevent Office 365 bouncebacks (NDRs)
            if "manoharan@arche.global" in email.lower() or "notfound" in email.lower():
                continue
                
            success = await GraphClient.send_mail_async(
                access_token=access_token,
                sender_email=settings.MICROSOFT_SENDER_EMAIL,
                recipient_email=email,
                subject=subject,
                html_body=html_body,
                attachment_path=None
            )
            if not success:
                all_success = False
                
        return all_success
