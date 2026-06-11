import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\models\workflow.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('__tablename__ = "workflow_instances"', '__tablename__ = "workflow_instances"\n    __table_args__ = {"extend_existing": True}')
content = content.replace('__tablename__ = "workflow_steps"', '__tablename__ = "workflow_steps"\n    __table_args__ = {"extend_existing": True}')
content = content.replace('__tablename__ = "in_app_notifications"', '__tablename__ = "in_app_notifications"\n    __table_args__ = {"extend_existing": True}')
content = content.replace('__tablename__ = "project_milestones"', '__tablename__ = "project_milestones"\n    __table_args__ = {"extend_existing": True}')

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\models\workflow.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated workflow models with extend_existing")
