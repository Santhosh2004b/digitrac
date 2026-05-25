from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base

class Tenant(Base):
    """
    SaaS Tenant Isolation Model (Objective 1)
    - Isolates organizations, custom domains, branding configs, and analytics.
    """
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    domain = Column(String, unique=True, nullable=True) # Custom company domains (Objective 2)
    logo_url = Column(String, nullable=True) # White-labeling (Objective 4)
    theme_color = Column(String, default="#00ffd1") # White-label branding theme hex
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    subscriptions = relationship("TenantSubscription", back_populates="tenant", cascade="all, delete-orphan")

class TenantSubscription(Base):
    """
    Subscription & Feature Gating Engine (Objective 3)
    - Tracks active plans (STARTER, PROFESSIONAL, ENTERPRISE) and metered usage.
    """
    __tablename__ = "tenant_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), unique=True)
    plan_type = Column(String, default="STARTER") # STARTER, PROFESSIONAL, ENTERPRISE
    max_users = Column(Integer, default=5)
    max_projects = Column(Integer, default=3)
    storage_limit_mb = Column(Float, default=100.0)
    
    # SaaS Usage Intelligence Meters (Objective 7)
    api_consumption_count = Column(Integer, default=0)
    notification_volume_count = Column(Integer, default=0)
    ai_analytics_consumption = Column(Integer, default=0)
    
    active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Back pop
    tenant = relationship("Tenant", back_populates="subscriptions")
