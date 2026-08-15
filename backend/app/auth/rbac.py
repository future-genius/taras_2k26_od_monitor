from fastapi import Header, HTTPException, status
from typing import List, Optional

class UserRole:
    PRESIDENT = "PRESIDENT"
    STAFF = "STAFF"
    STUDENT = "STUDENT"

def get_current_user_role(x_user_role: Optional[str] = Header(None, alias="X-User-Role")) -> str:
    """
    Extracts user role from authentication header.
    Defaults to STUDENT read-only if unspecified.
    """
    if not x_user_role:
        return UserRole.STUDENT
    role_upper = x_user_role.upper()
    if role_upper in [UserRole.PRESIDENT, UserRole.STAFF, UserRole.STUDENT]:
        return role_upper
    return UserRole.STUDENT

def require_role(allowed_roles: List[str]):
    """
    FastAPI dependency enforcing strict backend RBAC rules.
    If the caller does not have one of the allowed_roles, returns 403 Forbidden.
    """
    def role_checker(current_role: str = Header(UserRole.STUDENT, alias="X-User-Role")):
        if current_role.upper() not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Action requires one of the following roles: {allowed_roles}. Current role: {current_role}"
            )
        return current_role
    return role_checker
