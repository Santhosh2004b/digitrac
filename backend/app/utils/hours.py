def get_smart_hours(qty, practice, component, item_type):
    # Base multiplier from component/practice
    base_hours = 4 # default
    
    p = str(practice).lower()
    c = str(component).lower()
    it = str(item_type).lower()
    
    if "switch" in c or "networking" in p:
        base_hours = 8
    if "firewall" in c or "security" in p:
        base_hours = 16
    if "server" in c or "compute" in p:
        base_hours = 32
    if "access control" in c or "surveillance" in c:
        base_hours = 12
    if "software" in it or "license" in it:
        base_hours = 2 # Usually less for just software activation
        
    return float(qty or 1) * base_hours
