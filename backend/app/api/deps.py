from fastapi import Request, HTTPException
from app.core.supabase import supabase


async def get_current_admin(request: Request):
    """Validate admin user from cookie"""
    # Get session cookie
    session = request.cookies.get("sb-access-token")
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Validate with Supabase
    user = await supabase.auth.get_user(session)
    if not user or user.user_metadata.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return user
