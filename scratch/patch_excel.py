import re

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\excel.py', 'r', encoding='utf-8') as f:
    content = f.read()

# I need to find the place where `ApprovedProject` is created and committed, typically in `approve_assign` endpoint.
patch = """
    # Intelligence Feed: Project Assignment
    from app.models.intelligence import IntelligenceEvent
    intel = IntelligenceEvent(
        project_id=new_proj.id,
        project_name=new_proj.project_name,
        category="ASSIGNMENT",
        priority="INFO",
        message=f"Project assigned to PM: {req.manager_email}",
        metrics={
            "Total Sell Value": f"₹{req.summary.get('total_sell_price', 0)}",
            "Target Margin": "15%" # assuming default 15%
        }
    )
    db.add(intel)
    db.commit()

    return {"status": "success", "project_id": new_proj.id}
"""

pattern = re.compile(r'    return \{"status": "success", "project_id": new_proj.id\}', re.DOTALL)
content = pattern.sub(patch.strip(), content)

with open(r'c:\Users\User\OneDrive - Arche Global Private Limited\Digitrac\Digitrac\app\routes\excel.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated excel.py")
