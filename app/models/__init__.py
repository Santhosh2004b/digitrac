from app.db.session import Base
from app.models.user import User
from app.models.project import Project, ProjectResource, ApprovedProject, MissionAssignment
from app.models.task import Task
from app.models.timelog import TimeLog
from app.models.resource import CentralizedResource
from app.models.governance import RIDEGovernance, AuditLog, ProjectBaseline, FinanceValidation
from app.models.workflow import WorkflowInstance, WorkflowStep, InAppNotification, ProjectMilestone
from app.models.saas import Tenant, TenantSubscription
from app.models.requests import ResourceRequest, MarginEscalation
from app.models.intelligence import IntelligenceEvent


# This is useful for Base.metadata.create_all(bind=engine)
